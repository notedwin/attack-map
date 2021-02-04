var net = require("net");
var log4js = require("log4js");
var datamaps = require("datamaps");
var Axios = require("axios");
let logger = log4js.getLogger();
logger.level = process.env.DEBUG_LEVEL || "info";

const port = 5001;
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

  return [user, ip, port, lon, lat];
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
  //this property shows the number of characters currently buffered to be written. (Number of characters is approximately equal to the number of bytes to be written, but the buffer may contain strings, and the strings are lazily encoded, so the exact number of bytes is not known.)
  //Users who experience large or growing bufferSize should attempt to "throttle" the data flows in their program with pause() and resume().

  console.log("bruh");

  socket.setEncoding("utf8");

  socket.setTimeout(800000, function () {
    // called after timeout -> same as socket.on('timeout')
    // it just tells that soket timed out => its ur job to end or destroy the socket.
    // socket.end() vs socket.destroy() => end allows us to send final data and allows some i/o activity to finish before destroying the socket
    // whereas destroy kills the socket immediately irrespective of whether any i/o operation is goin on or not...force destry takes place
    console.log("Socket timed out");
  });

  socket.on("data", async function (data) {
    //echo data
    var dat = await data2ip(data);

    console.log("Parsed : " + dat);
  });

  socket.on("error", function (error) {
    console.log("Error : " + error);
  });

  socket.on("timeout", function () {
    console.log("Socket timed out !");
    socket.end("Timed out!");
    // can call socket.destroy() here too.
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

// emits when any error occurs -> calls closed event immediately after this.
server.on("error", function (error) {
  console.log("Error: " + error);
});

//emits when server is bound with server.listen
server.on("listening", function () {
  console.log("Server is listening!");
});

server.maxConnections = 10;

//static port allocation
server.listen(port);

// for dyanmic port allocation

var islistening = server.listening;

if (islistening) {
  console.log("Server is listening");
} else {
  console.log("Server is not listening");
}

setTimeout(function () {
  server.close();
}, 5000000);
