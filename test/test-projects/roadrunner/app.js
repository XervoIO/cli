var express = require('express');
var app = express.createServer();

console.log(process.env);

app.configure(function(){
  app.use(express.static(__dirname + '/public'));
  app.set('view engine', 'ejs');
});

app.get('/', function(req, res){
  res.render('index', {});
});

app.get('/location/cincy', function(req, res){
  res.render('cincy');
});

app.get('/location/stlouis', function(req, res){
  res.render('stlouis', {});
});

app.get('/location/wichita', function(req, res){
  res.render('wichita', {});
});

app.get('/location/albuquerque', function(req, res){
  res.render('albuquerque', {});
});

app.listen(8080);
console.log('Listening on port 8080');