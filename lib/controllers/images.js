var librarian = require('../common/api').librarian;
var userConfig = require('../common/api').userConfig;

var images = module.exports = {};

images.getAll = function (callback) {
  return librarian.images.getAll(userConfig.data.apiKey, callback);
};
