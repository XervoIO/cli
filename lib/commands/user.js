var modulus = require('../modulus'),
    userConfig = require('../common/api').userConfig,
    userController = require('../controllers/user'),
    error = require('../common/error');

var user = {};

user.authenticate = function(username, password, cb) {
  userController.authenticate(
    username,
    password,
    function(err, u) {
      if(err) {
        err = error.handleApiError(err, 'LOGIN', cb);
        if (err.length > 0) {
          modulus.io.error(err);
          return user.login(false, cb);
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

user.authenticateGithub = function(username, password, cb) {
  userController.authenticateGithub(
    username,
    password,
    function(err, u) {
      if(err) {
        err = error.handleApiError(err, 'LOGIN', cb);
        if(err.length > 0) {
          modulus.io.error(err);
          return user.login(true, cb);
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

user.isAuthenticated = function() {
  userConfig.load();
  if(userConfig.data && userConfig.data.userId) {
    modulus.io.print('You are logged in as ' + userConfig.data.username.magenta);
    return true;
  }
  return false;
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
          user.authenticate(result.username, result.password, cb);
      });
  });
};

user.login = function(github, cb) {
  if (github) {
    modulus.io.prompt.get([{
      name: 'login',
      description: 'Enter your GitHub username or email:',
      required: true
    }, {
      name: 'password',
      description: 'Enter your password:',
      hidden: true,
      required: true
    }], function (err, result) {
      if(err) {
        return error.handlePromptError(err, cb);
      }

      user.authenticateGithub(result.login, result.password, cb);
    });
  } else {
    modulus.io.prompt.get([{
      name: 'login',
      description: 'Enter your username or email:',
      required: true
    }, {
      name: 'password',
      description: 'Enter your password:',
      hidden: true,
      required: true
    }], function (err, result) {
      if(err) {
        return error.handlePromptError(err, cb);
      }

      user.authenticate(result.login, result.password, cb);
    });
  }
  
};

user.logout = function(cb) {
  userConfig.clear();
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

module.exports = user;