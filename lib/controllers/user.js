var librarian = require('../common/api').librarian,
    userConfig = require('../common/api').userConfig,
    util = require('util'),
    request = require('request');

var User = function() {

};

User.prototype.get = function(userId, callback) {
  librarian.user.get(userId, userConfig.data.apiKey, callback);
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

module.exports = new User();