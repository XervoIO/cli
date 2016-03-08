const Express = require('express');
const Logger = require('@modulus/logger')('CLI');
const Path = require('path');

const App = Express.createServer();

const PORT = 8080;

Logger.debug(process.env);// eslint-disable-line no-process-env

App.configure(function () {
  App.use(Express.static(Path.join(__dirname, '/public')));
  App.set('view engine', 'ejs');
});

App.get('/', function (req, res) {
  res.render('index', {});
});

App.get('/location/cincy', function (req, res) {
  res.render('cincy');
});

App.get('/location/stlouis', function (req, res) {
  res.render('stlouis', {});
});

App.get('/location/wichita', function (req, res) {
  res.render('wichita', {});
});

App.get('/location/albuquerque', function (req, res) {
  res.render('albuquerque', {});
});

App.listen(PORT);
Logger.debug('Listening on port', PORT);
