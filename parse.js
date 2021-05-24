var net = require("net");
var Axios = require("axios");
var express = require("express");
var app = express();
var path = require("path");
const { filter } = require("bluebird");
require("dotenv").config();

const redis = require("redis").createClient({
  host: process.env.REDIS_IP,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASS,
});

redis.on("connect", () => {
  console.log("Redis Connected");
  require("bluebird").promisifyAll(redis);
});

app.set("view engine", "ejs");

app.use(express.static(__dirname + "/public"));

app.set("views", path.join(__dirname, "./views"));

// render based on 50 most recent access
//make it render real-time?
async function getData(lat_long) {
  try {
    min_ago = String(Math.floor((Date.now() - 1440 * 60000) / 1000));
    hackers = await redis.zrangebyscoreAsync("hackers", min_ago, "inf");
    for (var index = 0; index < hackers.length; ++index) {
      hacker = await redis.hgetallAsync(hackers[index]);
      if (hacker === null) {
        break;
      }
      //hacker.dest = Math.floor(Math.random() * 2);

      var date = new Date(hackers[index] * 1000);
      var hours = date.getHours();
      var minutes = "0" + date.getMinutes();
      var seconds = "0" + date.getSeconds();
      var formattedTime =
        hours + ":" + minutes.substr(-2) + ":" + seconds.substr(-2);
      hacker.time = formattedTime;
      lat_long.push(hacker);
    }
  } catch (err) {
    console.log(err);
  }
}

function filter_data(data) {
  // return unique attempts based on ip and user
  var resArr = [];
  data.filter(function (item) {
    var i = resArr.findIndex(
      (x) => x.user == item.user && x.ip == item.ip
    );
    if (i <= -1) {
      resArr.push(item);
    }
  });
  return resArr;
}

app.get("/globe", async function (req, res) {
  lat_long = new Array();
  await getData(lat_long);
  res.render("globe", { loc: lat_long });
});

app.get("", async function (req, res) {
  lat_long = new Array();
  await getData(lat_long);
  lat_long = filter_data(lat_long);
  res.render("index", { loc: lat_long });
});

async function populateRedis(ip, user, port, server) {
  // I don't know if this is the correct way to do async but it works
  // Memoization, prevent API call for the same IP
  try {
    var data = {};
    exists = await redis.existsAsync(ip);
    if (exists == 1) {
      data = await redis.hgetallAsync(ip);
    } else {
      const API_URL = "http://ip-api.com/json/";
      var { data, status, statusText } = await Axios.get(`${API_URL}/${ip}`);
      if (!data || status !== 200 || data.status !== "success") {
        throw new Error(`Unsuccessful request (${status}): ${data}`);
      }
      for (const key in data) {
        if (data[key] === "") {
          data[key] = "none";
        }
      }
      redis.HMSET(ip, "lon", data.lon, "lat", data.lat);
    }

    time = String(Math.floor(Date.now() / 1000));
    redis.HMSET(
      time,
      "user",
      user,
      "ip",
      ip,
      "port",
      port,
      "lon",
      data.lon,
      "lat",
      data.lat,
      "dest",
      server
    );
    redis.zadd("hackers", time, time);
  } catch (err) {
    console.log(err);
  }
}

//server is rsyslog server
//server_c is cowrie log server

var server = net.createServer();
var server_c = net.createServer();
var server_n = net.createServer();

server.on("connection", function (socket) {
  socket.on("data", async function (data) {
    data_arr = data.toString().split(/[ ,]+/);
    //insecure put this in .env
    if (data_arr[4] === "root" || data_arr[4] === "pi") {
      var user = data_arr[4];
      var ip = data_arr[6];
      var port = data_arr.reverse()[1];
    } else {
      var user = data_arr[6];
      var ip = data_arr[8];
      var port = data_arr.reverse()[1];
    }
    await populateRedis(ip, user, port, 0);
  });
});

server_c.on("connection", function (socket) {
  socket.on("data", async function (data) {
    p = data
      .toString()
      .replace(/[ =|,]/g, ",")
      .split(/[ ,]+/)
      .reverse();
    var user = p[2];
    var ip = p[6];
    var port = Math.floor(Math.random() * (6000 - 1024 + 1)) + 1024;
    await populateRedis(ip, user, port, 1);
  });
});

server_n.on("connection", function (socket) {
  console.log("connect to nginx server.");

  socket.on("data", async function (data) {
    data_arr = JSON.parse(data.toString().substring(40));
    var port = Math.floor(Math.random() * (6000 - 1024 + 1)) + 1024;
    var user = "chrome";
    var ip = data_arr.remote_addr;
    //do not populate redis with nginx attempts
    //create a new map and do this instead so we don't mix data
    //when you do this flushdb
    //await populateRedis(ip, user, port, 0);
  });
});

//nginx logs
server_n.listen(process.env.NGINX, () => {
  console.log("Listening for NGINX access logs");
});

//rsyslog-ssh
server.listen(process.env.RSYSLOG, "127.0.0.1", () => {
  console.log("Listening for RSYSLOG-SSH");
});
//cowrie
server_c.listen(process.env.COWRIE, () => {
  console.log("Listening for Cowrie Logs from AWS ");
});

//front-end 3000
app.listen(process.env.FRONT_END, () => {
  console.log(
    `Example app listening at http://localhost:${process.env.FRONT_END}`
  );
});
