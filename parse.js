var net = require("net");
var Axios = require("axios");
var express = require("express");
var app = express();
var path = require("path");
const d3 = require("d3");
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

const port = process.env.LOG_PORT;
const html_port = process.env.SERVER_PORT;

// the line below will go down as the worlds best database LOL xD

app.use(express.static(__dirname + "/public"));
//app.set('views', path.join(__dirname, '/views'));

app.set("views", path.join(__dirname, "./views"));
// render based on 50 most recent access
app.get("", async function (req, res) {
  lat_long = new Array()
  try{
    min_ago = String(Math.floor((Date.now() - 30*60000) / 1000));
    hackers = await redis.zrangebyscoreAsync("hackers", min_ago , "inf");
    for (index = 0; index<hackers.length; ++index){
      lat_long.push(await redis.hgetallAsync(hackers[index]));
    }
    console.log(hackers);
  } catch(err){
    console.log(err)
  }
  res.render("index", { loc: lat_long });
});

app.listen(html_port, () => {
  console.log(`Example app listening at http://localhost:${html_port}`);
});

const API_URL = "http://ip-api.com/json/";
var server = net.createServer();

async function data2ip(data) {
  data_arr = data.toString().split(/[ ,]+/);
  if (data_arr[4] === "root" || data_arr[4] === "pi") {
    var user = data_arr[4];
    var ip = data_arr[6];
    var port = data_arr.reverse()[1];
  } else {
    var user = data_arr[6];
    var ip = data_arr[8];
    var port = data_arr.reverse()[1];
  }

  // can keep this since we have the redis behind
  const ipLocation = await doApiCall(ip);
  const { lon, lat } = ipLocation;

  time = String(Math.floor(Date.now() / 1000));

  redis.HMSET(time,"user",user,"ip",ip,"port",port,"lon",lon,"lat",lat);
  redis.zadd("hackers",time,time);
}

async function retrieveLocationFromAPI(ip) {
  const { data, status, statusText } = await Axios.get(`${API_URL}/${ip}`);
  if (!data || status !== 200 || data.status !== "success") {
    throw new Error(`Unsuccessful request (${status}): ${data}`);
  }
  // Sometimes the API returns empty values
  // defaulting every empty string to 'none'
  for (const key in data) {
    if (data[key] === "") {
      data[key] = "none";
    }
  }
  return data;
}

async function doApiCall(ip) {
  // I don't know if this is the correct way to do async but it works
  // Memoization, prevent API call for the same IP
  exists = await redis.existsAsync(ip);
  if (exists == 1) {
    console.log("redis has the IP");
    data = await redis.hgetallAsync(ip);
    return { lon: data.lon, lat: data.lat };
  } else {
    const data = await retrieveLocationFromAPI(ip);
    console.log(data);
    redis.HMSET(ip, "lon", data.lon, "lat", data.lat);
    //return only data we need
    return { lon: data.lon, lat: data.lat };
  }
}

//emitted when server closes ...not emitted until all connections closes.
server.on("close", function () {
  console.log("Server closed !");
});

// emitted when new client connects
server.on("connection", function (socket) {
  console.log("connect to log server.");

  socket.setEncoding("utf8");

  socket.setTimeout(800000, function () {
    console.log("Socket timed out");
  });

  socket.on("data", async function (data) {
    //without this the data from log has nowhere to go
    await data2ip(data);
  });

  socket.on("error", function (error) {
    console.log("Error : " + error);
  });

  socket.on("timeout", function () {
    console.log("Socket timed out !");
    socket.end("Timed out!");
  });

  socket.on("end", function (data) {
    console.log("Socket ended from other end!");
    console.log("End data : " + data);
  });

  socket.on("close", function (error) {
    console.log("Socket closed!");
    if (error) {
      console.log("Socket was closed coz of transmission error");
    }
  });

  setTimeout(function () {
    var isdestroyed = socket.destroyed;
    console.log("Socket destroyed:" + isdestroyed);
    socket.destroy();
  }, 1200000);
});

server.on("error", function (error) {
  console.log("Error: " + error);
});

server.on("listening", function () {
  console.log("Log server is listening");
});

server.maxConnections = 10;

server.listen(port);

setTimeout(function () {
  server.close();
}, 5000000);
