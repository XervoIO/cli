var crypto = require('crypto');

var util = {};

/**
 * Create a sha512 hash of the supplied value.
 * @static
 * @param {string} value The string value to hash.
 * @return {string} Hex string representation of the hashed value.
 */
util.createHash = function(value) {
  return crypto.createHash('sha512').update(value).digest('hex');
};

module.exports = util;