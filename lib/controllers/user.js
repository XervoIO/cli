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

var librarian = require('../common/api').librarian,
    userConfig = require('../common/api').userConfig,
    util = require('util'),
    request = require('request');

var User = function() {

};

/**
 * If the MODULUS_TOKEN environment variable is set this
 * will log the user in using that info.
 */
User.prototype.initAuthToken = function(callback) {
  if(process.env.MODULUS_TOKEN) {
    this.getForToken(process.env.MODULUS_TOKEN, function(err, result) {
      if(err) {
        return callback(err);
      }
      else {
        userConfig.data = {};
        userConfig.data.apiKey = process.env.MODULUS_TOKEN;
        userConfig.data.userId = result.id;
        userConfig.data.username = result.username;
        callback(null, userConfig);
      }
    });
  }
  else {
    callback();
  }
};

User.prototype.get = function(userId, callback) {
  librarian.user.get(userId, userConfig.data.apiKey, callback);
};

User.prototype.getForToken = function(token, callback) {
  librarian.user.getForToken(token, callback);
};

User.prototype.create = function(username, email, password, callback) {
  var hashPass = librarian.util.createHash(password);
  librarian.user.create({
    username : username,
    email : email,
    password : hashPass
  }, callback);
};

User.prototype.authenticate = function(login, password, callback) {
  var hashPass = librarian.util.createHash(password);
  librarian.user.authenticate(login, hashPass, callback);
};

User.prototype.authenticateGithub = function(login, password, callback) {
  var token = null
    , user = new Buffer(util.format('%s:%s', login, password), 'ascii').toString('base64');

  var opts = {
    url: 'https://api.github.com/authorizations',
    headers: {
      'User-Agent': 'https://modulus.io/',
      authorization: util.format('basic %s', user)
    }
  };

  request.get(opts, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var authorizations = JSON.parse(body);
      for (var i = 0; i < authorizations.length; i++) {
        // Find the authorization for the Modulus GitHub application in order
        // to get the user's OAuth token.
        if (authorizations[i].app.name === 'Modulus') {
          token = authorizations[i].token;
          break;
        }
      }

      if (token) {
        librarian.user.authenticateOAuth('github', token, callback);
      } else {
        callback({ code: 'OAUTH_TOKEN_NOT_FOUND' }, null);
      }
    } else {
      if (response.statusCode === 403) {
        callback({ code: 'LOGIN' }, null);
      } else {
        callback(error || { code: 'LOGIN' }, null);
      }
    }
  });
};

User.prototype.resetPassword = function(email, callback) {
  librarian.user.resetPassword(email, callback);
};

User.prototype.createToken = function(callback) {
  librarian.user.createToken(userConfig.data.userId, userConfig.data.apiKey, function(err, result) {
    var key = null;
    if(result) {
      key = result.key;
    }

    callback(err, key);
  });
};

User.prototype.getTokens = function(callback) {
  librarian.user.getTokens(userConfig.data.userId, userConfig.data.apiKey, callback);
};

User.prototype.removeToken = function(token, callback) {
  librarian.user.removeToken(token, userConfig.data.userId, userConfig.data.apiKey, callback);
}

module.exports = new User();