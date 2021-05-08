var express = require("express");
var app = express();
var path = require("path");

app.set("view engine", "ejs");

app.use(express.static(__dirname + "/public"));


app.set("views", path.join(__dirname, "./views"));

app.get("", function (req, res) {
  res.render("globe");
});

app.listen(5000, () => {
  console.log(`Example app listening at http://localhost:5000}`);
});



