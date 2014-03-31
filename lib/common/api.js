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

var UserConfig = require('./userConfig'),
  url = require('url'),
  librarian = require('../librarian/librarian'),
  userConfig = new UserConfig();

userConfig.load();

if (userConfig.data && userConfig.data.api_uri) {
  var url = url.parse(userConfig.data.api_uri);

  if (url.protocol === 'https:') {
    librarian.init(url.hostname, url.port || 443, true);
  } else {
    librarian.init(url.hostname, url.port || 80, false);
  }
} else {
  librarian.init('api.onmodulus.net', 443, true);
}

module.exports = {
  librarian : librarian,
  userConfig : new UserConfig()
};
