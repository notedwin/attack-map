use std::net::{SocketAddr, TcpStream};

use rustypi::{pull_hackers, Hacker};

fn main() {
    let hackers: Vec<Hacker> = pull_hackers();

    for hacker in hackers {
        let ip:SocketAddr = format!("{}:443", hacker.ip.clone()).parse().expect("Could not parse ip");

        // try to connect to the ip
        match TcpStream::connect_timeout(&ip, std::time::Duration::from_secs(1)) {
            Ok(_) => {
                println!("{} is up", ip);
            }
            Err(_) => {
                continue;
            }
        }
    }
}