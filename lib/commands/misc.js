var modulus = require('../modulus'),
    async = require('async'),
    userConfig = require('../common/api').userConfig,
    librarian = require('../common/api').librarian,
    userController = require('../controllers/user'),
    error = require('../common/error'),
    fs = require('fs');

var misc = {};

misc.contact = function(message, cb) {
  async.waterfall([
    function(callback) {
      userController.get(userConfig.data.userId, callback);
    },
    function(user, callback) {
      librarian.contact({email : user.email, message : message}, callback);
    }
  ], function(err, results) {
    modulus.io.success('Feedback sent. Thank you for the message.');
    return cb();
  });
};

module.exports = misc;