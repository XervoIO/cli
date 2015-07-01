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

var Errors     = require('../util/errors');
var librarian  = require('../common/api').librarian;
var modulus    = require('../modulus');
var Progress   = require('../util/progress');
var userConfig = require('../common/api').userConfig;

//-----------------------------------------------------------------------------
var Servo = function () {};

//-----------------------------------------------------------------------------
Servo.prototype.find = function (servoId, callback) {
  librarian.servo.get(servoId, userConfig.data.apiKey, callback);
};

//-----------------------------------------------------------------------------
Servo.prototype.list = function (opts, callback) {
  librarian.servo.getAll(opts, userConfig.data.apiKey, callback);
};

//-----------------------------------------------------------------------------
Servo.prototype.restart = function (servoId, callback) {
  librarian.servo.restart(servoId, userConfig.data.apiKey, function (err, result) {
    if (err) return callback(Errors.getMessage(err));

    var dbar = new Progress.indeterminate('Restarting [:bar]');
    modulus.io.startIndeterminate(dbar);

    var checkStatus = function() {
      librarian.servo.get(servoId, userConfig.data.apiKey, function (err, servo) {
        if (err) return callback(Errors.getMessage(err));

        if (servo.status.toLowerCase() === 'running') {
          modulus.io.stopIndeterminate(dbar);
          modulus.io.print(' ');
          return callback(null, servo);
        } else {
          setTimeout(checkStatus, 1000);
        }
      });
    };

    setTimeout(checkStatus, 1000);
  });
};

module.exports = new Servo();
