const https = require("https");
const http = require("http");
Tail = require("tail").Tail;

const hostname = "127.0.0.1";
const port = 3000;
var response = "";

const server = http.createServer((req, res) => {
  tail = new Tail("/home/ezfire/ssd-recurringbackup/coding/attack-map/ssh.out");

  tail.on("line", function (data) {
    console.log(data);

    var options = {
      method: "GET",
      hostname: "freegeoip.app",
      port: null,
      path: "/json/73.123.21.12",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
    };

    var reqa = https.request(options, function (resu) {
      var chunks = [];

      resu.on("data", function (chunk) {
        chunks.push(chunk);
      });

      resu.on("end", function () {
        var body = Buffer.concat(chunks);
        console.log("done")
        //response = JSON.parse(body);
        //console.log(response.latitude);
      });
    });

    reqa.end();
  });

  tail.on("error", function (error) {
    console.log("ERROR: ", error);
  });

  res.statusCode = 200;
  res.setHeader("Content-Type", "text/plain");
  res.end("Hello World");
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
