var error = module.exports;

error.handlePromptError = function(err, cb) {
  //Check if canceled by the user (CTRL+C)
  if(err.message && err.message === 'canceled') {
    console.log(''); //Extra space.
    return cb('Canceled by user.');
  }

  modulus.io.error(err);
  return cb(err);
};

error.handleApiError = function(err, command, cb) {
  var e = error.getError(err, command);

  if(e.level < 2) {
    cb(e.message);
    return '';
  } else {
    return e.message;
  }
};

error.getError = function(err, command) {

  var id = 'DEFAULT';
  var msg = '';

  if(err.code) {
    id = err.code;
  } else if(err.errors && err.errors.length > 0) {
    id = err.errors[0].id;
    msg = err.errors[0].message;
  }

  for(var e in error.responseCodes) {
    if(id === e) {
      // If there is no message set,
      // use the message from congress
      if(error.responseCodes[e].message === null) {
        var ret = error.responseCodes[e];
        ret.message = msg;

        return ret;
      }

      return error.responseCodes[e];
    }
  }

  if(typeof command === 'string') {
    for(var c in error.commandCodes) {
      if(command === c) {
        return error.commandCodes[c];
      }
    }
  }

  return error.responseCodes.DEFAULT;
};

/*--- Error Codes ---*/
// Level 0 - Something very bad happened, panic.
// Level 1 - Processing error, do not continue.
// Level 2 - Format/Input error, try again.
error.responseCodes = {
  DEFAULT : {
    id : 'DEFAULT',
    level : 1,
    message : 'There was an error processing your request.'
  },
  ECONNREFUSED : {
    id : 'ECONNREFUSED',
    level : 1,
    message : 'Could not connect to Modulus.'
  },
  INVALID_AUTH : {
    id : 'INVALID_AUTH',
    level : 1,
    message : 'Your session has expired. Please log in to continue.'
  },
  USERNAME_ALREADY_EXISTS : {
    id : 'USERNAME_ALREADY_EXISTS',
    level : 2,
    message : null
  },
  EMAIL_ALREADY_EXISTS : {
    id : 'EMAIL_ALREADY_EXISTS',
    level : 2,
    message : null
  },
  BETA_KEY_NOT_FOUND : {
    id : 'BETA_KEY_NOT_FOUND',
    level : 2,
    message : null
  },
  BETA_KEY_ALEADY_USED : {
    id : 'BETA_KEY_ALEADY_USED',
    level : 2,
    message : null
  },
  PROJECT_LIMIT_REACHED : {
    id : 'PROJECT_LIMIT_REACHED',
    level : 1,
    message : null
  },
  NO_CAPACITY : {
    id : 'NO_CAPACITY',
    level : 2,
    message : 'Not enough capacity for new project. New capacity is being added now. Please attempt the request again in a few minutes.'
  },
  PROJECT_ZIP_TOO_LARGE: {
    id : 'PROJECT_ZIP_TOO_LARGE',
    level : 1,
    message : 'Your application must be less than 1gb in size.'
  },
  NO_MATCHING_NAME: {
    id : 'NO_MATCHING_NAME',
    level: 1,
    message: 'No project found that matches specified name.'
  },
  OAUTH_TOKEN_NOT_FOUND: {
    id : 'OAUTH_TOKEN_NOT_FOUND',
    level : 1,
    message : 'Please link your account with GitHub using the web portal to use GitHub authentication.'
  },
  SINGLE_SIGN_ON_USER_NOT_FOUND: {
    id : 'SINGLE_SIGN_ON_USER_NOT_FOUND',
    level : 1,
    message : 'GitHub account not found. Please link your account with GitHub using the web portal to use GitHub authentication.'
  },
  INVALID_ENV_VARIABLE_VALUE: {
    id: 'INVALID_ENV_VARIABLE_VALUE',
    level: 2,
    message: 'Environment variable values cannot contain single or double quotes.'
  },
  INVALID_ENV_VARIABLE_NAME: {
    id: 'INVALID_ENV_VARIABLE_NAME',
    level: 2,
    message: 'Variable names cannot start with numbers, can only contain alpha-numeric characters and underscores, and cannot contain quotes.'
  }
};

error.commandCodes = {
  LOGIN : {
    id : 'LOGIN',
    level : 2,
    message : 'Username or Password incorrect.\nFor Github users, use the --github option.'
  }
};