var modulus = require('../modulus'),
    librarian = require('../common/api').librarian,
    userConfig = require('../common/api').userConfig;

//-----------------------------------------------------------------------------
var Mongo = function() {
};

//-----------------------------------------------------------------------------
Mongo.prototype.databasesForUser = function(userId, callback) {
  librarian.user.getDatabases(userId, userConfig.data.apiKey, callback);
};

//-----------------------------------------------------------------------------
Mongo.prototype.create = function(name, creatorId, regionData, callback) {
  librarian.database.create({
    name    : name,
    userId  : creatorId,
    iaas    : regionData.iaas,
    region  : regionData.region,
    version : regionData.version
  }, userConfig.data.apiKey, callback);
};

//-----------------------------------------------------------------------------
Mongo.prototype.getDeployTargets = function (callback) {
  librarian.database.getDeployTargets(callback);
};

//-----------------------------------------------------------------------------
Mongo.prototype.createUser = function(dbId, username, password, isReadOnly, callback) {
  librarian.database.createUser(dbId, {
    username: username,
    password: password,
    isReadOnly: isReadOnly
  }, userConfig.data.apiKey, callback);
};

module.exports = new Mongo();
