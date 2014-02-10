var modulus = require('../modulus'),
    librarian = require('../common/api').librarian,
    userConfig = require('../common/api').userConfig;

//-----------------------------------------------------------------------------
var Mongo = function() {
};

//-----------------------------------------------------------------------------
Mongo.prototype.create = function(name, creatorId, callback) {
  librarian.database.create({
    name: name,
    userId: creatorId
  }, userConfig.data.apiKey, callback);
};

module.exports = new Mongo();