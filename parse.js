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

let logger = log4js.getLogger();
logger.level = process.env.DEBUG_LEVEL || "info";
app.set('view engine', 'ejs');

//TODO: add datamaps functionality
//TODO: add https

const port = 5001;
const html_port = 3000;
var info_arr = new Array();

app.use(express.static(__dirname + '/public'));
//app.set('views', path.join(__dirname, '/views'));

app.set('views', path.join(__dirname, './views'));


app.get("", function (req, res) {
  res.render("index", {loc: info_arr});
});

app.listen(html_port, () => {
  console.log(`Example app listening at http://localhost:${html_port}`);
});

const clients = {};
const API_URL = "http://ip-api.com/json/";
// creates the server
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

  const ipLocation = await doApiCall(ip);
  const { lon, lat } = ipLocation;

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
  // see https://github.com/acouvreur/ssh-log-to-influx/issues/35
  for (const key in data) {
    if (data[key] === "") {
      data[key] = "none";
    }
  }

  return data;
}

async function doApiCall(ip) {
  // Memoization, prevent API call for the same IP
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
  console.log("Server is listening!");
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
