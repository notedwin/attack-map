use std::fs::{self, File};
use std::io::{prelude::*, BufReader};
use std::io::{Seek, SeekFrom};
use std::time::Duration;
use rustypi::{parse_log_line,CE};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    simple_logger::init_with_level(log::Level::Trace)?;
    log::warn!("starting log ingestion... ");
    let path = &CE.path;
    let mut len = fs::metadata(path)?.len();
    loop {
        std::thread::sleep(Duration::from_secs(10));
        let new_len = fs::metadata(path)?.len();

        if new_len == len {
            log::warn!("Same Size File: {}", len);
        } else {
            log::warn!("Different: {}", len);
            let file = File::open(path)?;
            let mut reader = BufReader::new(file);
            reader.seek(SeekFrom::Start(len))?;
            for line in reader.lines() {
                let line = line?;
                if let Err(e) = parse_log_line(&line).await {
                    log::error!("{}", e);
                }
            }
            len = new_len;
        }
    }
}