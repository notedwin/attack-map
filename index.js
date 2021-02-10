//TODO: add https
//TODO: add datamaps functionality
//TODO: add https

const https = require('https');
const fs = require('fs');
const express = require("express");



var app = express();
require('dotenv').config();//process.env.*

var httpsOptions = {
    key: fs.readFileSync(__dirname + '/tls/key.pem'),
    cert: fs.readFileSync(__dirname + '/tls/cert.pem')
};

app.get("/", function (req, res) {
    var html = fs.readFileSync(__dirname + '/index.html', 'utf8');
    res.send(html);
  });

//http.createServer(app).listen(8888);
https.createServer(httpsOptions, app).listen(process.env.SERVER_PORT);