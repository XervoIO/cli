var modulus = require('../modulus'),
    userConfig = require('../common/api').userConfig,
    userController = require('../controllers/user'),
    error = require('../common/error');

var user = {};

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
    }], function (err, result) {
      if(err) {
        return error.handlePromptError(err, cb);
      }

      // Create user
      userController.create(
        result.username,
        result.email,
        result.password,
        function(err, user) {
        if(err) {
          err = error.handleApiError(err, 'SIGNUP', cb);
          if(err.length > 0) {
            modulus.io.error(err);
            return _signupPrompt(cb);
          }
        }
        modulus.io.success('User ' + result.username.data + ' has been created successfully.');
        modulus.io.print('You should receive an email at ' + result.email.data + ' with more information.');
        return cb();
      });
  });
};

user.login = function(cb) {
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
    userController.authenticate(
      result.login,
      result.password,
      function(err, u) {
       if(err) {
          err = error.handleApiError(err, 'LOGIN', cb);
          if(err.length > 0) {
            modulus.io.error(err);
            return user.login(cb);
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
  });
};

user.logout = function(cb) {
  userConfig.clear();
  modulus.io.success('You have signed out of ' + 'Modulus'.data);
  return cb();
};

user.unlock = function(cb) {
  modulus.io.prompt.get([{
    name: 'betakey',
    description: 'Enter a beta code:',
    required: true
  }], function(err, result) {
    if(err) {
      return error.handlePromptError(err, cb);
    }
    var userId = userConfig.data.userId;
    userController.unlock(
      userId,
      result.betakey,
      function(err, res) {
        if(err) {
          err = error.handleApiError(err, 'UNLOCK', cb);
          if(err.length > 0) {
            modulus.io.error(err);
            return user.unlock(cb);
          }
        }

        modulus.io.success('Your account has been unlocked. You may now create and deploy projects');
        return cb();
    });
  });
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