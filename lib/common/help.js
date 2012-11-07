var help = function(name, modulus) {
  this.name = name;
  this.modulus = modulus;

  this.commands = {};
  this.ordered = [];
  this.pad = 0;
};

help.prototype.add = function(command, print) {
  if(this.commands.hasOwnProperty(command)) {
    return;
  }

  if(typeof print === 'function') {
    this.commands[command] = print.bind(this);
  } else {
    this.commands[command] = print;
  }

  this.ordered.push(command);
};

help.prototype.remove = function(command) {
  delete this.commands[command];

  for(var c = 0; c < this.ordered.length; c++) {
    if(this.ordered[c] === command) {
      this.ordered.splice(c, 1);
      return;
    }
  }
};

help.prototype.line = function(text) {
  var padding = '';
  for(var p = 0; p < this.pad; p++) {
    padding += ' ';
  }

  this.modulus.io.print(padding + text);
};

help.prototype.print = function() {
  this.line((this.name + ' Commands').verbose.underline);
  this.line('');

  this.pad += 2;

  var cmd;
  for(var c = 0; c < this.ordered.length; c++) {
    output = this.commands[this.ordered[c]];

    if(typeof output === 'string') {
      this.modulus.io.print(output);
    }

    if(typeof output === 'function') {
      output();
    }

    this.line('');
  }

  this.pad -= 2;
};

help.prototype.getPrinter = function() {
  return this.print.bind(this);
};

module.exports = help;
