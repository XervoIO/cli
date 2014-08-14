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

var prompt = require('prompt');

prompt.start();
prompt.message = '[' + '?'.yellow + '] ';
prompt.delimiter = '';

var io = {};

io.print = function(text) {
  console.log(text.white);
};

io.write = function(text) {
  process.stdout.write(text);
};

io.success = function(text) {
  io.print('[' + '✓'.green + ']' + ' ' + text);
};

io.warning = function(text) {
  io.print('[' + 'Warning'.warn + '] ' + text);
};

io.error = function(text) {
  io.print('[' + 'Error'.error + '] ' + text);
};

/**
 * Helper for starting an indeterminate progress bar.
 * @param {Object} bar The progress bar to start.
 */
io.startIndeterminate = function (bar) {
  if (process.stdout.isTTY) {
    return bar.start();
  }
};

/**
 * Helper for stoping an indeterminate progress bar.
 * @param {Object} bar The progress bar to stop.
 */
io.stopIndeterminate = function (bar) {
  if (process.stdout.isTTY) {
    return bar.stop();
  }
};

io.prompt = prompt;

module.exports = io;
