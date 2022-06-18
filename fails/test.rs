use log::warn;
use regex::Regex;
use std::fs::File;
use std::io::SeekFrom;
use std::io::prelude::*;
use std::io::BufReader;
use std::process::Command;
use std::process::Stdio;
use std::fs;
use std::time::Duration;
use std::thread;

fn main() {
    simple_logger::init_with_level(log::Level::Trace).unwrap();
    log::warn!("starting test");

    // /var/log/auth.log
    let path = "/Users/edwinzamudio/Downloads/auth.log";
    
    // set new variable equal to len of file
    let mut len = fs::metadata(path).unwrap().len();
    warn!("{}", len);

    loop {
        thread::sleep(Duration::from_secs(5));
        let nlen = fs::metadata(path).unwrap().len();

        if nlen != len {
            warn!("Different: {}", len);
            let file = File::open(path).unwrap();
            let mut reader = BufReader::new(file);
            reader.seek(SeekFrom::Start(len)).unwrap();
            for line in reader.lines() {
                let line = line.unwrap();
                println!("{}", line);
            }
            len = nlen;
        }
        else{
            warn!("Same: {}", len);
        }
    }
}
    


// // use tail -Fn0 /var/log/auth.log | grep sshd
// let cmd = Command::new("tail")
// .arg("-f")
// .arg("/var/log/auth.log")
// .stdout(Stdio::piped())
// .spawn();

// match cmd {
// Ok(child) => {
//     log::warn!("child spawned");
//     let mut stdout = BufReader::new(child.stdout.unwrap());
//     let mut line = String::new();
    
//     loop {
//         // print!("[{}]", line);
//         stdout.read_line(&mut line).unwrap();
//         let reg: Regex = Regex::new(r"(\w{0,9}  \d{1,2} \d{2}:\d{2}:\d{2})( localhost sshd\[\d*]: Failed password for invalid user )(\w{0,12})( from )(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}).*").unwrap();

//         let mut count = 0;

//         line.split("\n").for_each(|line| {
//             if reg.is_match(line) {
//                 log::warn!("{}:{}",count, line);
//                 count += 1;
//             }
//         });
//     }
// }
// Err(e) => {
//     log::error!("{}", e);
// }
// }