use std::net::{SocketAddr, TcpStream};

use rustypi::{pull_hackers, Hacker};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let hackers: Vec<Hacker> = pull_hackers()?;
    // array of unique IPs
    let mut unique_ips: Vec<String> = Vec::new();
    for hacker in hackers {
        if !unique_ips.contains(&hacker.ip) {
            unique_ips.push(hacker.ip.to_string());
        }
    }

    for raw_ip in unique_ips {

        let ip:SocketAddr = format!("{}:443", raw_ip.clone()).parse()?;

        // try to connect to the ip
        match TcpStream::connect_timeout(&ip, std::time::Duration::from_secs(1)) {
            Ok(_) => {
                println!("{} is up", ip);
            }
            Err(_) => {
                continue;
            }
        }
        //let mut file = std::fs::File::create("ips.txt").expect("Could not create file");
        //file.write_all(format!("{}\n", ip).as_bytes()).expect("Could not write to file");
        // do not search ips that we have previously found
        //if !ips.contains(&ip) {
        //    ips.push(ip);
        //}
        //println!("{}", ip);

        // report
    }
    Ok(())
}