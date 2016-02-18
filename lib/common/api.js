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

const URL = require('url');

const UserConfig = require('./userConfig');
const Librarian = require('../librarian/librarian');

const NewUserConfig = new UserConfig();
const HTTPS_PORT = 443;
const PORT = 80;

var apiUri;

NewUserConfig.load();

if (NewUserConfig.data && NewUserConfig.data.api_uri) {
  apiUri = URL.parse(NewUserConfig.data.api_uri);

  if (apiUri.protocol === 'https:') {
    Librarian.init(apiUri.hostname, apiUri.port || HTTPS_PORT, true);
  } else {
    Librarian.init(apiUri.hostname, apiUri.port || PORT, false);
  }
} else {
  Librarian.init('api.onmodulus.net', HTTPS_PORT, true);
}

module.exports = {
  librarian: Librarian,
  userConfig: new UserConfig()
};
