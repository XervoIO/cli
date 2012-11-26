var prompt = require('prompt');

prompt.start();
prompt.message = '[' + '?'.yellow + '] ';
prompt.delimiter = '';

var io = {};

io.print = function(text) {
  console.log(text.white);
};

io.success = function(text) {
  io.print('[' + '✓'.green + ']' + ' ' + text);
};

io.error = function(text) {
  io.print('[' + 'Error'.error + '] ' + text);
};

io.prompt = prompt;

module.exports = io;