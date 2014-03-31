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

var modulus = require('../modulus'),
  userConfig = require('../common/api').userConfig,
  util = require('util'),
  url = require('url');

const invalid = ['username', 'userId', 'apiKey'];

exports.get = function list(name, cb) {
  userConfig.load();

  if (!userConfig.data.hasOwnProperty(name)) {
    return cb('Configuration name not found.');
  }

  modulus.io.print(util.format('%s: %s', name, userConfig.data[name]).input);

  return cb();
};

exports.set = function set(name, value, cb) {
  if (invalid.indexOf(name.toLowerCase()) >= 0) {
    //
    // Don't allow username, userId, or apiKey to be set by the user.
    //
    return cb(util.format('Cannot set value of \'%s\'', name));
  }

  userConfig.load();

  if (!userConfig.data) userConfig.data = {};

  try {
    //
    // Attempt to parse the value to JSON. This will ensure that Booleans are
    //    correctly stored as JSON rather than a string.
    //
    userConfig.data[name] = JSON.parse(value);
  } catch (e) {
    userConfig.data[name] = value;
  }

  userConfig.save(userConfig.data);
  modulus.io.print(util.format('Saved \'%s\' to \'%s\'', value, name).input);

  return cb();
};
