var xervo = require('../xervo'),
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
          xervo.io.error(err);

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
      xervo.io.success('Signed in as user ' + u.username.data);
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
          xervo.io.error(err);

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
      xervo.io.success('Signed in as user ' + u.username.data);
      return cb();
  });
};

user.isAuthenticated = function(callback) {
  userController.initAuthToken(function(err, result) {
    if(err) {
      xervo.io.error('Invalid XERVO_TOKEN value.');
      return callback();
    }
    if(!result) {
      userConfig.load();
    }
    if(userConfig.data && userConfig.data.userId) {
      xervo.io.print('You are logged in as ' + userConfig.data.username.magenta);
      return callback(null, true);
    }
    return callback(null, false);
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
    xervo.io.prompt.get(prompt, function (err, result) {
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
  xervo.io.success('You have signed out of ' + ''.data);
  return cb();
};

user.resetPassword = function(cb) {
  xervo.io.prompt.get([{
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
            xervo.io.error(err);
            return user.unlock(cb);
          }
        } else {
          xervo.io.print('You should receive an email at ' + result.email.data + ' with instructions on resetting your password.');
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
    xervo.io.success('Token: ' + result);
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
      xervo.io.print('You have no tokens. Tokens can be created using the "xervo token create" command.');
      return cb();
    }

    xervo.io.print('Current tokens:'.input);
    result.forEach(function(token) {
      xervo.io.print(token.key);
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

    xervo.io.success('Token successfully removed.');
    cb();
  });
};

module.exports = user;
