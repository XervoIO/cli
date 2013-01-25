//-----------------------------------------------------------------------------
var Errors = {};

/**
 * Finds the message from within the error object.
 * @param {object} err The error object.
 * @returns {string} Error message, if found.
 */
//-----------------------------------------------------------------------------
Errors.getMessage = function(err) {
  if(!err) {
    return '';
  }

  if(err.message) {
    return err.message;
  }

  if(err.errors) {
    return err.errors[0].message;
  }

  try {
    return JSON.stringify(err);
  }
  catch(exp) {
    return '';
  }
};

module.exports = Errors;