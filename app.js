const https = require("https");
const http = require("http");
var fs = require("fs");

Tail = require("tail").Tail;

const hostname = "127.0.0.1";
const port = 3000;

var latlog = [];

script = `var map = new Datamap({
    scope: 'world',
    element: document.getElementById('container'),
    projection: 'mercator',
    height: 500,
})

map.arc([
    {
        origin: {
            latitude: latlog[],
            longitude: 73.778889
        },
        destination: {
            latitude: 41.8781, 
            longitude: -87.6298
        }
    },
    {
        origin: {
            latitude: 30.194444,
            longitude: -97.67
        },
        destination: {
            latitude: 25.793333,
            longitude: -0.290556
        }
    }
], { strokeWidth: 2 });


//bubbles, custom popup on hover template
map.bubbles([
    { name: 'Hot', latitude: 21.32, longitude: 5.32, radius: 10, fillKey: 'gt50' },
    { name: 'Chilly', latitude: -25.32, longitude: 120.32, radius: 18, fillKey: 'lt50' },
    { name: 'Hot again', latitude: 21.32, longitude: -84.32, radius: 8, fillKey: 'gt50' },

], {
    popupTemplate: function (geo, data) {
        return "<div class='hoverinfo'>It is " + data.name + "</div>";
    }
});`

function update(data) {
  var options = {
    method: "GET",
    hostname: "freegeoip.app",
    port: null,
    path: "/json/".concat(data),
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
      //console.log("done");
      response = JSON.parse(body);
      latlog = latlog.concat({
        ip: data,
        latitude: response.latitude,
        longitude: response.longitude,
      });
    });
  });

  reqa.end();
}

const server = http.createServer((req, res) => {
  tail = new Tail("/home/ezfire/ssd-recurringbackup/coding/attack-map/ssh.out");
  tail.watch();

  tail.on("line", function (data) {
    update(data);
    console.log(latlog,latlog.longitude,latlog[1].longitude);
    //next update visual array
  });

  tail.on("error", function (error) {
    console.log("ERROR: ", error);
  });
  fs.readFile("./index.html", null, function (error, data) {
    if (error) {
      res.writeHead(404);
      res.write("Whoops! File not found!");
    }

    var toPrepand = `<script> ${script} </script>`;
    var resul = data.replace(/\<\/body>/g, toPrepand + "</body>");

    fs.writeFile("./test.html", resul, "utf8", function (err) {
      if (err) return console.log(err);
    });
  });
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
