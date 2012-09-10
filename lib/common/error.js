var error = module.exports;

error.handlePromptError = function(err, cb) {
  modulus.io.error(err);
  return cb(err);
};

error.handleApiError = function(err, cb) {
  var fe = error.getApiFirstError(err);
  if(fe) {
    return cb(fe.message);
  }
  return cb(err);
};

error.getApiFirstError = function(err) {
  if(err.errors && err.errors.length > 0) {
    return err.errors[0];
  }
  return null;
};

error.responseCodes = {};
error.responseCodes.BETA_KEY_NOT_FOUND = {
  id : "BETA_KEY_NOT_FOUND",
  message : "Invalid beta code : "
};