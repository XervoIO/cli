/* eslint-disable no-sync */
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

const FS = require('fs');

var UserConfig;

function getUserHome() {
  return process.env[process.platform === 'win32' ? 'USERPROFILE' : 'HOME'];// eslint-disable-line no-process-env
}

UserConfig = function () {
  this.dir = getUserHome() + '/.modulus/';
  if (!FS.existsSync(this.dir)) FS.mkdirSync(this.dir);
};

UserConfig.prototype.load = function () {
  var configFile = this.dir + 'current-modc.json';
  if (FS.existsSync(configFile)) {
    try {
      this.data = JSON.parse(FS.readFileSync(configFile));
    } catch (e) {
      this.data = null;
    }
    return true;
  }

  return false;
};

UserConfig.prototype.save = function (data) {
  var configFile = this.dir + 'current-modc.json';
  FS.writeFileSync(configFile, JSON.stringify(data));
  return true;
};

UserConfig.prototype.clearSession = function () {
  this.load();

  delete this.data.apiKey;
  delete this.data.userId;
  delete this.data.username;

  this.save(this.data);

  return true;
};

module.exports = UserConfig;
/* eslint-enable no-sync */
