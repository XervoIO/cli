var modulus = require('../modulus'),
    librarian = require('../common/api').librarian,
    userConfig = require('../common/api').userConfig,
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
      librarian.user.create({
        username: result.username,
        email: result.email,
        password: librarian.util.createHash(result.password)
      }, function(err, user) {
        if(err) {
          // TODO: check error code and output message
          modulus.io.error(err);
          return _signupPrompt(cb);
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
    var password = librarian.util.createHash(result.password);
    librarian.user.authenticate(
      result.login,
      password,
      function(err, u) {
        if(err) {
          // TODO: check error code if network issue or something unsolvable
          // break out, if username or pass incorrect reask
          modulus.io.error('Username or password incorrect.');
          return user.login(cb);
        }
        var udata = {
          username: u.username,
          userId : u.id,
          apiKey : password
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
    librarian.user.unlock(
      userId,
      result.betakey,
      function(err, res) {
        if(err) {
          var fe = error.getApiFirstError(err);
          if(fe && fe.id === error.responseCodes.BETA_KEY_NOT_FOUND.id) {
            modulus.io.error(error.responseCodes.BETA_KEY_NOT_FOUND.message);
            return user.unlock(cb);
          } else if(fe.message) {
            modulus.io.error(fe.message);
            return cb(fe.message);
          }

          modulus.io.error(err);
          return cb(err);
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
    librarian.user.resetPassword(
      result.email,
      function(err, res) {
        modulus.io.print('You should receive an email at ' + result.email.data + ' with instructions on resetting your password.');
        return cb();
    });
  });
};

module.exports = user;