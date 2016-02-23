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

const Errors = require('../util/errors');
const Librarian = require('../common/api').librarian;
const Modulus = require('../modulus');
const Progress = require('../util/progress');
const UserConfig = require('../common/api').userConfig;

const TIMEOUT = 1000;

// ----------------------------------------------------------------------------
var Servo = function () {};

// ----------------------------------------------------------------------------
Servo.prototype.find = function (servoId, callback) {
  Librarian.servo.get(servoId, UserConfig.data.apiKey, callback);
};

// ----------------------------------------------------------------------------
Servo.prototype.list = function (opts, callback) {
  Librarian.servo.getAll(opts, UserConfig.data.apiKey, callback);
};

// ----------------------------------------------------------------------------
Servo.prototype.restart = function (servoId, callback) {
  Librarian.servo.restart(
    servoId, UserConfig.data.apiKey, function (err, result) {
      var dbar = new Progress.Indeterminate('Restarting [:bar]');
      var checkStatus;
      if (err) return callback(Errors.getMessage(err));

      Modulus.io.startIndeterminate(dbar);

      checkStatus = function () {
        Librarian.servo.get(
          servoId, UserConfig.data.apiKey, function (err, servo) {
            if (err) return callback(Errors.getMessage(err));

            if (servo.status.toLowerCase() === 'running') {
              Modulus.io.stopIndeterminate(dbar);
              Modulus.io.print(' ');
              return callback(null, servo);
            }
            setTimeout(checkStatus, TIMEOUT);
          });
      };

      setTimeout(checkStatus, TIMEOUT);
    });
};

module.exports = new Servo();
