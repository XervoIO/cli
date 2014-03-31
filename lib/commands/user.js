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
    userController = require('../controllers/user'),
    error = require('../common/error'),
    util = require('util');

var user = {};

user.authenticate = function(username, password, loginProvided, passwordProvided, cb) {
  userController.authenticate(
    username,
    password,
    function(err, u) {
      if(err) {
        err = error.handleApiError(err, 'LOGIN', cb);
        if (err.length > 0) {
          modulus.io.error(err);

          if(loginProvided && passwordProvided) {
            return;
          } else if(loginProvided) {
            return user.login(username, null, false, cb);
          } else if(passwordProvided) {
            return user.login(null, password, false, cb);
          } else {
            return user.login(null, null, false, cb);
          }
        }
      }

      userConfig.load();
      var udata = null;

      if (userConfig.data) {
        // Don't overwrite existing data.
        udata = util._extend(userConfig.data, {
          username: u.username,
          userId : u.id,
          apiKey : u.authToken
        });
      } else {
        udata = {
          username: u.username,
          userId : u.id,
          apiKey : u.authToken
        };
      }

      userConfig.save(udata);
      modulus.io.success('Signed in as user ' + u.username.data);
      return cb();
  });
};

user.authenticateGithub = function(username, password, loginProvided, passwordProvided, cb) {
  userController.authenticateGithub(
    username,
    password,
    function(err, u) {
      if(err) {
        err = error.handleApiError(err, 'LOGIN', cb);
        if(err.length > 0) {
          modulus.io.error(err);

          if(loginProvided && passwordProvided) {
            return;
          } else if(loginProvided) {
            return user.login(username, null, true, cb);
          } else if(passwordProvided) {
            return user.login(null, password, true, cb);
          } else {
            return user.login(null, null, true, cb);
          }
        }
      }
      var udata = {
        username: u.username,
        userId : u.id,
        apiKey : u.authToken
      };
      userConfig.save(udata);
      modulus.io.success('Signed in as user ' + u.username.data);
      return cb();
  });
};

user.isAuthenticated = function(callback) {
  userController.initAuthToken(function(err, result) {
    if(err) {
      modulus.io.error('Invalid MODULUS_TOKEN value.');
      return callback();
    }
    if(!result) {
      userConfig.load();
    }
    if(userConfig.data && userConfig.data.userId) {
      modulus.io.print('You are logged in as ' + userConfig.data.username.magenta);
      return callback(null, true);
    }
    return callback(null, false);
  });
};

user.signup = function(cb) {
  modulus.io.print('In order to sign up we a few pieces of information.');
  _signupPrompt(cb);
};

var _signupPrompt = function(cb) {
  modulus.io.prompt.get([{
      name: 'username',
      description: 'Choose a username:',
      message: 'Username is required and can not be longer than 50 chars.',
      maxLength : 50,
      pattern: /^[a-zA-Z0-9()<>\[\]:,;@\"!#$%&'*+\-\/=?\^_`{}|~?\.]+$/,
      conform : function(value) {
        // TODO: check with api if username exists
        return true;
      },
      required: true
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
      if(err) {
        return error.handlePromptError(err, cb);
      }

      if(result.password !== result.passwordConfirm) {
        modulus.io.error('Passwords much match.');
        return _signupPrompt(cb);
      }

      // Create user
      userController.create(
        result.username,
        result.email,
        result.password,
        function(err, u) {
          if(err) {
            err = error.handleApiError(err, 'SIGNUP', cb);
            if(err.length > 0) {
              modulus.io.error(err);
              return _signupPrompt(cb);
            }
          }

          modulus.io.success('User ' + result.username.data + ' has been created successfully.');
          modulus.io.print('You should receive an email at ' + result.email.data + ' with more information.');
          user.authenticate(result.username, result.password, false, false, cb);
      });
  });
};

user.login = function(username, password, github, cb) {
  var login = username,
      loginProvided = true,
      pass = password,
      passProvided = true,
      prompt = [],
      authFunction = github ? user.authenticateGithub : user.authenticate;

  if(typeof login !== 'string' || login.length < 1) {
    prompt.push({
      name: 'login',
      description: 'Enter your username or email:',
      required: true
    });

    if(github) {
      prompt[0].description = 'Enter your GitHub username or email:';
    }

    login = undefined;
    loginProvided = false;
  }

  if(typeof pass !== 'string' || pass.length < 1) {
    prompt.push({
      name: 'password',
      description: 'Enter your password:',
      hidden: true,
      required: true
    });

    pass = undefined;
    passProvided = false;
  }

  if(prompt.length > 0) {
    modulus.io.prompt.get(prompt, function (err, result) {
      if(err) {
         return error.handlePromptError(err, cb);
       }
       authFunction.call(user, login || result.login, pass || result.password, loginProvided, passProvided, cb);
    });
  }
  else {
    authFunction.call(user, login, password, loginProvided, passProvided, cb);
  }
};

user.logout = function(cb) {
  userConfig.clearSession();
  modulus.io.success('You have signed out of ' + 'Modulus'.data);
  return cb();
};

user.resetPassword = function(cb) {
  modulus.io.prompt.get([{
    name: 'email',
    description: 'Enter email for account:',
    format: 'email'
  }], function(err, result) {
    if(err) {
      return error.handlePromptError(err, cb);
    }
    userController.resetPassword(
      result.email,
      function(err, res) {
        if(err) {
          err = error.handleApiError(err, 'UNLOCK', cb);
          if(err.length > 0) {
            modulus.io.error(err);
            return user.unlock(cb);
          }
        } else {
          modulus.io.print('You should receive an email at ' + result.email.data + ' with instructions on resetting your password.');
          return cb();
        }
    });
  });
};

user.createToken = function(cb) {
  userController.createToken(function(err, result) {

    if(err) {
      err = error.handleApiError(err, 'CREATE_TOKEN', cb);

      if(err.length > 0) {
        return cb(err);
      }
    }
    modulus.io.success('Token: ' + result);
    cb();
  });
};

user.listTokens = function(cb) {
  userController.getTokens(function(err, result) {

    if(err) {
      err = error.handleApiError(err, 'LIST_TOKENS', cb);

      if(err.length > 0) {
        return cb(err);
      }
    }

    if(result.length === 0) {
      modulus.io.print('You have no tokens. Tokens can be created using the "modulus token create" command.');
      return cb();
    }

    modulus.io.print('Current tokens:'.input);
    result.forEach(function(token) {
      modulus.io.print(token.key);
    });

    cb();
  });
};

user.removeToken = function(token, cb) {
  userController.removeToken(token, function(err, result) {

    if(err) {
      err = error.handleApiError(err, 'REMOVE_TOKEN', cb);

      if(err.length > 0) {
        return cb(err);
      }
    }

    modulus.io.success('Token successfully removed.');
    cb();
  });
};

module.exports = user;
