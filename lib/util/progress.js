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

var modulus = require('../modulus');

var Progress = {};

Progress.indeterminate = function(fmt, opts) {
  opts = opts || {};
  this.fmt = fmt;
  this.width = opts.width || 20;
  this.animateTime = opts.animateTime || 250;
  this.timeout = null;
  this.curr = 0;
  this.rl = require('readline').createInterface({
    input: process.stdin,
    output: opts.stream || process.stdout
  });
  this.rl.setPrompt('', 0);
};

Progress.indeterminate.prototype.start = function() {

  this.curr = 0;
  this.tick();
};

Progress.indeterminate.prototype.stop = function() {
  clearTimeout(this.timeout);
  this.rl.resume();
  this.rl.close();
};

Progress.indeterminate.prototype.tick = function() {
  var pstr = Array(this.width).join(' ');
  pstr = pstr.substring(0,this.curr) + '=' + pstr.substring(this.curr);
  var str = this.fmt.replace(':bar', pstr);
  this.rl.write(null, {ctrl: true, name: 'u'});
  this.rl.write(str);
  this.curr = (this.curr + 1) % this.width;
  var self = this;
  this.timeout = setTimeout(function(){
    self.tick();
  }, this.animateTime);
};

module.exports = Progress;
