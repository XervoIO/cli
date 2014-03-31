/*
 * Copyright (c) 2014 Modulus
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 */

var help = function(name, modulus) {
  this.name = name;
  this.modulus = modulus;

  this.commands = {};
  this.ordered = [];
  this.pad = 0;
};

help.usagePrinters = {};
help.printUsage = function(command) {
  var printer = help.usagePrinters[command];
  if(printer) {
    printer.modulus.io.print('Usage:');
    printer.print();
  }
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

  help.usagePrinters[command] = {
    modulus: this.modulus,
    print: this.commands[command]
  };

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
