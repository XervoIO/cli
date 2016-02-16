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

const Modulus = require('../modulus');
const UserConfig = require('../common/api').userConfig;
const UserController = require('../controllers/user');
const Errors = require('../common/error');
const Util = require('util');

var _signupPrompt, user = {};// eslint-disable-line no-underscore-dangle
var print = Modulus.io.print;

user.authenticate = function (username, password, loginProvided, passwordProvided, cb) {
  UserController.authenticate(
    username,
    password,
    function (err, u) {
      var udata = null;
      if (err) {
        err = Errors.handleApiError(err, 'LOGIN', cb);
        if (err.length > 0) {
          Modulus.io.error(err);

          if (loginProvided && passwordProvided) return;
          if (loginProvided) return user.login(username, null, true, cb);
          if (passwordProvided) return user.login(null, password, true, cb);

          return user.login(null, null, true, cb);
        }
      }

      UserConfig.load();

      if (UserConfig.data) {
        // Don't overwrite existing data.
        udata = Util._extend(UserConfig.data, {// eslint-disable-line no-underscore-dangle
          username: u.username,
          userId: u.id,
          apiKey: u.authToken
        });
      } else {
        udata = {
          username: u.username,
          userId: u.id,
          apiKey: u.authToken
        };
      }

      UserConfig.save(udata);
      Modulus.io.success('Signed in as user ' + u.username.data);
      return cb();
    });
};

user.authenticateGithub = function (username, password, loginProvided, passwordProvided, cb) {
  UserController.authenticateGithub(
    username,
    password,
    function (err, u) {
      var udata;
      if (err) {
        err = Errors.handleApiError(err, 'LOGIN', cb);
        if (err.length > 0) {
          Modulus.io.error(err);

          if (loginProvided && passwordProvided) return;
          if (loginProvided) return user.login(username, null, true, cb);
          if (passwordProvided) return user.login(null, password, true, cb);

          return user.login(null, null, true, cb);
        }
      }
      udata = {
        username: u.username,
        userId: u.id,
        apiKey: u.authToken
      };
      UserConfig.save(udata);
      Modulus.io.success('Signed in as user ' + u.username.data);
      return cb();
    });
};

user.isAuthenticated = function (callback) {
  UserController.initAuthToken(function (err, result) {
    if (err) {
      Modulus.io.error('Invalid MODULUS_TOKEN value.');
      return callback();
    }
    if (!result) {
      UserConfig.load();
    }
    if (UserConfig.data && UserConfig.data.userId) {
      print('You are logged in as ' + UserConfig.data.username.magenta);
      return callback(null, true);
    }
    return callback(null, false);
  });
};

user.signup = function (cb) {
  print('In order to sign up we a few pieces of information.');
  _signupPrompt(cb);
};

_signupPrompt = function (cb) { // eslint-disable-line no-underscore-dangle
  Modulus.io.prompt.get([{
    name: 'username',
    description: 'Choose a username:',
    message: 'Username is required and can not be longer than 50 chars.',
    maxLength: 50,
    pattern: /^[a-zA-Z0-9()<>\[\]:,;@\"!#$%&'*+\-\/=?\^_`{}|~?\.]+$/,
    conform: function (value) {
      // TODO: check with api if username exists
      return true;
    },
    required: true
  }, {
    name: 'jobTitle',
    description: 'Enter your job title (optional):',
    required: false
  }, {
    name: 'company',
    description: 'Enter your company name (optional):',
    required: false
  }, {
    name: 'email',
    description: 'Enter a valid email:',
    message: 'Email must be valid.',
    format: 'email',
    required: true
  }, {
    name: 'password',
    description: 'Enter a password:',
    required: true,
    hidden: true
  }, {
    name: 'passwordConfirm',
    description: 'Confirm your password:',
    required: true,
    hidden: true
  }], function (err, result) {
    if (err) return Errors.handlePromptError(err, cb);
    if (result.password !== result.passwordConfirm) {
      Modulus.io.error('Passwords much match.');
      return _signupPrompt(cb);
    }

      // Create user
    UserController.create(
      result.username,
      result.email,
      result.jobTitle,
      result.company,
      result.password,
      function (err, u) {
        if (err) {
          err = Errors.handleApiError(err, 'SIGNUP', cb);
          if (err.length > 0) {
            Modulus.io.error(err);
            return _signupPrompt(cb);
          }
        }

        Modulus.io.success('User ' + result.username.data + ' has been created successfully.');
        print('You should receive an email at ' + result.email.data + ' with more information.');
        user.authenticate(result.username, result.password, false, false, cb);
      });
  });
};

user.login = function (username, password, github, cb) {
  var login = username;
  var loginProvided = true;
  var pass = password;
  var passProvided = true;
  var prompt = [];
  var authFunction = github ? user.authenticateGithub : user.authenticate;

  if (typeof login !== 'string' || login.length < 1) {
    prompt.push({
      name: 'login',
      description: 'Enter your username or email:',
      required: true
    });

    if (github) prompt[0].description = 'Enter your GitHub username or email:';
    login = null;
    loginProvided = false;
  }

  if (typeof pass !== 'string' || pass.length < 1) {
    prompt.push({
      name: 'password',
      description: 'Enter your password:',
      hidden: true,
      required: true
    });

    pass = null;
    passProvided = false;
  }

  if (prompt.length > 0) {
    Modulus.io.prompt.get(prompt, function (err, result) {
      if (err) return Errors.handlePromptError(err, cb);
      authFunction.call(user, login || result.login, pass || result.password, loginProvided, passProvided, cb);
    });
  } else {
    authFunction.call(user, login, password, loginProvided, passProvided, cb);
  }
};

user.logout = function (cb) {
  UserConfig.clearSession();
  Modulus.io.success('You have signed out of ' + 'Modulus'.data);
  return cb();
};

user.resetPassword = function (cb) {
  Modulus.io.prompt.get([{
    name: 'email',
    description: 'Enter email for account:',
    format: 'email'
  }], function (err, result) {
    if (err) return Errors.handlePromptError(err, cb);
    UserController.resetPassword(
      result.email,
      function (err, res) {
        if (err) {
          err = Errors.handleApiError(err, 'UNLOCK', cb);
          if (err.length > 0) {
            Modulus.io.error(err);
            return user.unlock(cb);
          }
        } else {
          print('You should receive an email at ' + result.email.data + ' with instructions on resetting your password.');
          return cb();
        }
      });
  });
};

user.createToken = function (cb) {
  UserController.createToken(function (err, result) {
    if (err) {
      err = Errors.handleApiError(err, 'CREATE_TOKEN', cb);
      if (err.length > 0) return cb(err);
    }

    Modulus.io.success('Token: ' + result);
    cb();
  });
};

user.listTokens = function (cb) {
  UserController.getTokens(function (err, result) {
    if (err) {
      err = Errors.handleApiError(err, 'LIST_TOKENS', cb);
      if (err.length > 0) return cb(err);
    }

    if (result.length === 0) {
      print('You have no tokens. Tokens can be created using the "modulus token create" command.');
      return cb();
    }

    print('Current tokens:'.input);
    result.forEach(function (token) {
      print(token.key);
    });

    cb();
  });
};

user.removeToken = function (token, cb) {
  UserController.removeToken(token, function (err, result) {
    if (err) {
      err = Errors.handleApiError(err, 'REMOVE_TOKEN', cb);
      if (err.length > 0) return cb(err);
    }

    Modulus.io.success('Token successfully removed.');
    cb();
  });
};

module.exports = user;
