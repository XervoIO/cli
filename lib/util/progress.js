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
