var net = require("net");
var log4js = require("log4js");
var d3 = require("d3");
var topojson = require("topojson");
var Axios = require("axios");
//var Datamaps = require("datamaps");
//var Canvas = require("canvas");
var express = require("express");
var app = express();
var path = require("path");
var request = require("request");
var cheerio = require("cheerio");
var fs = require("fs");
var https = require("https")
require('dotenv').config();

const redis = require("redis").createClient({
  host: process.env.REDIS_IP,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASS
});

redis.on('connect', () => {
  console.log('[PASS]'.green + 'Redis Connected');
  require('bluebird').promisifyAll(redis)
});

redis.HMSET('may 4, 11:44', "ip", "127.0.0.1", "lat", "long");

redis.HGETALL("may 4, 11:44", function(err, value) {
  console.log(value.ip);
  console.log(value.lat);
});

let logger = log4js.getLogger();
logger.level = process.env.DEBUG_LEVEL || "info";
app.set('view engine', 'ejs');


const port = 5001;
const html_port = 3000;


// the line below will go down as the worlds best database LOL xD
var info_arr = new Array(); 

app.use(express.static(__dirname + '/public'));
//app.set('views', path.join(__dirname, '/views'));

app.set('views', path.join(__dirname, './views'));


app.get("", function (req, res) {
  // render based on 50 most recent access
  res.render("index", {loc: info_arr});
});

app.listen(html_port, () => {
  console.log(`Example app listening at http://localhost:${html_port}`);
});

//database #2
const clients = {};
const API_URL = "http://ip-api.com/json/";
// creates the server
var server = net.createServer();

async function data2ip(data) {
  data_arr = data.toString().split(/[ ,]+/);
  console.log("Clean : " + data_arr);
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
  // once we use redis we can just do an array no need to deconstruct JSON
  //lon = ipLocation[0]
  //lat = ipLocation[1]
  const { lon, lat } = ipLocation;

  

  time = String(Math.floor(Date.now() / 1000));

  //redis.HMSET(time,'user', user, 'ip', ip, 'port', port, 'long', lon, 'lat', lat)

  var res = { };
  res["user"] = user;
  res["ip"] = ip;
  res["port"] = port;
  res["long"] = lon;
  res["lat"] = lat;

  info_arr.push(res);

  return res;
}

async function retrieveLocationFromAPI(ip) {
  const { data, status, statusText } = await Axios.get(`${API_URL}/${ip}`);
  if (!data || status !== 200 || data.status !== "success") {
    logger.error(`Unsuccessful request (${status}): ${statusText}`, data);
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
  // TODO: Memoize into redis
  // TODO: Check if IP is local so we don't waste time
  // Memoization, prevent API call for the same IP
  //redis.HMSET()
  // if (redis.EXISTS(ip)){
  //    console.log('redis has this IP')
  // redis.HGETALL(ip, function(err, value) {
  //    return [value.lat,value.long];
  //});
  // return [0,0];
  //}

  if (clients[ip]) {
    logger.debug(
      `Not making an API Call for ${ip}, using in memory from previous calls`,
      clients[ip]
    );
    return clients[ip];
  }

  try {
    const data = await retrieveLocationFromAPI(ip);
    clients[ip] = data;
    // redis.HMSET(ip,'long', lon, 'lat', lat)
    return data;
  } catch (e) {
    logger.error(e);
    return null;
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
    var dat = await data2ip(data);
    console.log("Parsed : " + JSON.stringify(dat));
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

var islistening = server.listening;

if (islistening) {
  console.log("Server is listening");
} else {
  console.log("Server is not listening");
}

setTimeout(function () {
  server.close();
}, 5000000);
