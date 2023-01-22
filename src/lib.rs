use chrono::{Local, NaiveDateTime};
use lazy_static::lazy_static;
use log::{error, warn};
use regex::Regex;
use redis::{Client, Commands, RedisResult, Value as RedisValue};

use serde::{Deserialize, Serialize};
use std::env;
use serde_json::{json, Value};

const API: &str = "http://ip-api.com/json/";
lazy_static! {
    pub static ref CE:Config = Config::new(env::args()).unwrap();
    static ref RE: Regex = Regex::new(r"(\w{0,9}\s+\d{1,2} \d{2}:\d{2}:\d{2}) localhost sshd\[\d*]: Failed password for invalid user (\w{0,12}) from (\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}).*").unwrap();
    static ref REDIS_CLIENT: Client = Client::open(CE.redis_url.to_string()).unwrap();
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Hacker {
    pub user: String,
    pub ip: String,
    pub lon: f64,
    pub lat: f64,
    pub time: String,
}

#[derive(Serialize, Deserialize, Debug)]
struct Location {
    lat: f64,
    lon: f64,
}

pub struct Config {
    pub path: String,
    pub redis_url: String,
}

impl Config {
    pub fn new(mut args: env::Args) -> Result<Self, &'static str> {
        args.next();

        let path = match args.next() {
            Some(arg) => arg,
            None => return Err("Didn't get a Path"),
        };

        let redis_url = match args.next() {
            Some(arg) => arg,
            None => return Err("Didn't get a redis url"),
        };

        Ok(Self { path, redis_url })
    }
}


pub fn pull_hackers() -> Result<Vec<Hacker>, Box<dyn std::error::Error>> {
    let mut con = REDIS_CLIENT.get_connection()?;
    let now: i64 = Local::now().timestamp();
    // 5 hours ago in seconds
    let five_hours_ago: i64 = now - (5 * 60 * 60);

    let result: Result<Vec<Hacker>, Box<dyn std::error::Error>> = redis::cmd("zrangebyscore")
        .arg("hackers")
        .arg(five_hours_ago)
        .arg(now)
        .query::<Vec<String>>(&mut con)?
        .iter()
        .map(|hacker| {
            //info!("hacker: {}", hacker);
            let hacker_json: String = con.get(hacker)?;
            let mut hacker_struct: Hacker = serde_json::from_str(&hacker_json)?;
            let time = NaiveDateTime::from_timestamp(hacker.parse::<i64>()?, 0);
            hacker_struct.time = time.format("%H:%M:%S").to_string();
            Ok(hacker_struct)
        })
        .collect();
    result
}

pub fn hacker_json() -> Result<(Value, usize), Box<dyn std::error::Error>> {
    let hackers = pull_hackers()?;
    let hackers_json: String = serde_json::to_string(&hackers)?;
    let h_string = json!( hackers_json);
    println!("hackers: {}", h_string);
    Ok((h_string, hackers.len()))
}

async fn populate_redis(user: &str, ip: &str, time: i64) -> Result<(), Box<dyn std::error::Error>> {
    warn!("Populate Redis: {} : {}", user, ip);

    let mut con = REDIS_CLIENT
        .get_connection()
        ?;

    let data: Location = get_ipdata(ip).await?;
    let hacker = Hacker {
        user: user.to_string(),
        ip: ip.to_string(),
        lon: data.lon,
        lat: data.lat,
        time: time.to_string(),
    };

    warn!("{:?}", hacker);
    let hacker_json: String = serde_json::to_string(&hacker)?;
    let res: RedisResult<RedisValue> = con.set(time.to_string(), hacker_json);

    if let Err(error) = res {
        warn!("Storing time event {:?}", error);
    }

    let res2: RedisResult<RedisValue> = con.zadd("hackers", time, time);

    if let Err(error) = res2 {
        warn!("adding event to time array {:?}", error);
    }

    // testing
    // let hackers: Vec<Hacker> = pull_hackers(con);
    // let hackers_json: String = serde_json::to_string(&hackers).unwrap();
    // warn!("hackers: {}", hackers_json);

    Ok(())
}
// Error: reqwest::Error { kind: Request, url: Url { scheme: "http", cannot_be_a_base: false, username: "", password: None, host: Some(Domain("i
// p-api.com")), port: None, path: "/json/198.50.229.117", query: None, fragment: None }, source: hyper::Error(Connect, ConnectError("dns error"
// , Custom { kind: Uncategorized, error: "failed to lookup address information: Try again" })) }

async fn get_ipdata(ip: &str) -> Result<Location, Box<dyn std::error::Error>> {
    let mut con = REDIS_CLIENT.get_connection()?;
    if con.exists(ip)? {
        warn!("{} already exists in redis", ip);
            let loc: String = con.get(ip)?;
            let location: Location = serde_json::from_str(&loc)?;
            Ok(location)
     } else {
            let url = format!("{}{}", API, ip);
            warn!("{} does not exist in redis, fetching from api", ip);
            let response = reqwest::get(&url).await?;

            let location: Location = response.json().await?;

            let res: RedisResult<RedisValue> = con.set(ip, serde_json::to_string(&location)?);
            if let Err(e) = res {
                error!("Error storing location data for IP: {}", e);
            }
            Ok(location)
        }
    }

pub async fn parse_log_line(line: &str) -> Result<(), Box<dyn std::error::Error>> {
    warn!("Line: {}", line);
    let mut log = RE.capture_locations();
    if RE.captures_read(&mut log, line).is_some(){

        let (u_start,u_end) = log.get(2).expect("Failed to get user");
        let user = &line[u_start..u_end];

        let (i_start,i_end) = log.get(3).expect("Failed to get ip");
        let ip = &line[i_start..i_end];

        let (t_start,t_end) = log.get(1).expect("Failed to get time");
        let time = &line[t_start..t_end];

        let year = Local::now().format("%Y").to_string();

        let timestamp = NaiveDateTime::parse_from_str(
            format!("{}{}", time, year).as_str(), // hard coded year, bruh moment
            "%b %e %T %Y",
        )?
        .timestamp();

        populate_redis(user, ip, timestamp).await?;
   }
   Ok(())
}