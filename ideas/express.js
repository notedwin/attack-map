var express = require('express');
var app = express();
var path = require('path');
var request = require('request');
var cheerio = require("cheerio");
var fs = require('fs')


const port = 3000

app.get('/', function(req, res, next) { 

    //res.sendFile(__dirname + '/index.html'); // just send file 

    fs.readFile(__dirname + '/index.html'), 'utf8', function (err,data) {
        if (err) {
            return console.log(err);
        }
        //console.log(data);
        var $ = cheerio.load('<h2 class="title">Hello world</h2>')
        $('h2.title').text('Hello there!')
        $('h2').addClass('welcome')    

        res.set('Content-Type', 'text/html; charset=utf-8');
        res.send($.html());
    });
});

app.post('/', function(req, res, next) {

});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})