/* eslint-disable no-process-env */
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

const Util = require('util');
const Request = require('request');

const Librarian = require('../common/api').librarian;
const UserConfig = require('../common/api').userConfig;

const OK = 200;
const FORBIDDEN = 403;

var User = function () {

};

/**
 * If the MODULUS_TOKEN environment variable is set this
 * will log the user in using that info.
 */
User.prototype.initAuthToken = function (callback) {
  if (process.env.MODULUS_TOKEN) {
    this.getForToken(process.env.MODULUS_TOKEN, function (err, result) {
      if (err) return callback(err);
      UserConfig.data = {};
      UserConfig.data.apiKey = process.env.MODULUS_TOKEN;
      UserConfig.data.userId = result.id;
      UserConfig.data.username = result.username;
      callback(null, UserConfig);
    });
  } else return callback();
};

User.prototype.get = function (userId, callback) {
  Librarian.user.get(userId, UserConfig.data.apiKey, callback);
};

User.prototype.getForToken = function (token, callback) {
  Librarian.user.getForToken(token, callback);
};

User.prototype.create = function (username, email, jobTitle, company, password, callback) {
  var hashPass = Librarian.util.createHash(password);
  Librarian.user.create({
    username: username,
    firstName: '',
    lastName: '',
    email: email,
    jobTitle: jobTitle,
    company: company,
    password: hashPass
  }, callback);
};

User.prototype.authenticate = function (login, password, callback) {
  var hashPass = Librarian.Util.createHash(password);
  Librarian.user.authenticate(login, hashPass, callback);
};

User.prototype.authenticateGithub = function (login, password, callback) {
  var token;
  var user = new Buffer(Util.format('%s:%s', login, password), 'ascii')
    .toString('base64');

  var opts = {
    url: 'https://api.github.com/authorizations',
    headers: {
      'User-Agent': 'https://modulus.io/',
      authorization: Util.format('basic %s', user)
    }
  };

  Request.get(opts, function (error, response, body) {
    var authorizations, i;
    if (!error && response.statusCode === OK) {
      authorizations = JSON.parse(body);
      for (i = 0; i < authorizations.length; ++i) {
        // Find the authorization for the Modulus GitHub application in order
        // to get the user's OAuth token.
        if (authorizations[i].app.name === 'Modulus') {
          token = authorizations[i].hashed_token;
          break;
        }
      }

      if (token) Librarian.user.authenticateOAuth('github', token, callback);
      else return callback({ code: 'OAUTH_TOKEN_NOT_FOUND' }, null);
    } else {
      if (response.statusCode === FORBIDDEN) {
        return callback({ code: 'LOGIN' }, null);
      }

      return callback(error || { code: 'LOGIN' }, null);
    }
  });
};

User.prototype.resetPassword = function (email, callback) {
  Librarian.user.resetPassword(email, callback);
};

User.prototype.createToken = function (callback) {
  Librarian.user.createToken(
    UserConfig.data.userId, UserConfig.data.apiKey, function (err, result) {
      var key;
      if (result) key = result.key;
      callback(err, key);
    });
};

User.prototype.getTokens = function (callback) {
  Librarian.user.getTokens(
    UserConfig.data.userId, UserConfig.data.apiKey, callback
  );
};

User.prototype.removeToken = function (token, callback) {
  Librarian.user.removeToken(
    token, UserConfig.data.userId, UserConfig.data.apiKey, callback
  );
};

module.exports = new User();
/* eslint-enable no-process-env */
