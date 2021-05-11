var net = require("net");

var server = net.createServer();


server.on("connection", function (socket) {
  console.log("connect to log server.");

  socket.on("data", function (data) {
    console.log('Received: ' + data);
  });

  socket.on("close", function (error) {
    console.log("Socket closed!");
    if (error) {
      console.log("error");
    }
  });
});

server.on("listening", function () {
  console.log("Log server is listening");
});

server.listen(6000);