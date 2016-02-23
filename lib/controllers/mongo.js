const Librarian = require('../common/api').librarian;
const UserConfig = require('../common/api').userConfig;

// ----------------------------------------------------------------------------
var Mongo = function () {
};

// ----------------------------------------------------------------------------
Mongo.prototype.databasesForUser = function (userId, callback) {
  Librarian.user.getDatabases(userId, UserConfig.data.apiKey, callback);
};

// ----------------------------------------------------------------------------
Mongo.prototype.create = function (name, creatorId, regionData, callback) {
  Librarian.database.create({
    name: name,
    userId: creatorId,
    iaas: regionData.iaas,
    region: regionData.region,
    version: regionData.version
  }, UserConfig.data.apiKey, callback);
};

// ----------------------------------------------------------------------------
Mongo.prototype.getDeployTargets = function (callback) {
  Librarian.database.getDeployTargets(callback);
};

// ----------------------------------------------------------------------------
Mongo.prototype.createUser = function (dbId, username, password, isReadOnly, callback) {
  Librarian.database.createUser(dbId, {
    username: username,
    password: password,
    isReadOnly: isReadOnly
  }, UserConfig.data.apiKey, callback);
};

module.exports = new Mongo();
