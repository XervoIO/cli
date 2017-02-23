var xervo = require('../xervo')
var librarian = require('../common/api').librarian
var apiUtil = require('@xervo/api-util')
var userConfig = require('../common/api').userConfig

// -----------------------------------------------------------------------------
var Mongo = function () {
}

// -----------------------------------------------------------------------------
Mongo.prototype.databasesForUser = function (userId, callback) {
  librarian.user.getDatabases(userId, userConfig.data.apiKey, callback)
}

// -----------------------------------------------------------------------------
Mongo.prototype.create = function (name, creatorId, regionData, callback) {
  librarian.database.create({
    name: name,
    userId: creatorId,
    iaas: regionData.iaas,
    region: regionData.region,
    version: regionData.version
  }, userConfig.data.apiKey, callback)
}

// -----------------------------------------------------------------------------
Mongo.prototype.clone = function (db, hosts, callback) {
  var api = userConfig.data.api_uri.split('://')

  var Client = apiUtil({
    protocol: api[0],
    hostname: api[1],
    port: api[0] === 'https' ? 443 : 80,
    version: 'v2',
    token: null
  })

  Client.post('/databases/' + db.id + '/clone', {
    db: db,
    hosts: hosts
  }, userConfig.data.apiKey, callback)
}

// -----------------------------------------------------------------------------
Mongo.prototype.getDeployTargets = function (callback) {
  librarian.database.getDeployTargets(callback)
}

// -----------------------------------------------------------------------------
Mongo.prototype.createUser = function (dbId, username, password, isReadOnly, callback) {
  if (username.indexOf('@') >= 0 || password.indexOf('@') >= 0) {
    return xervo.io.error('`@` not allowed in username or password.')
  }

  librarian.database.createUser(dbId, {
    username: username,
    password: password,
    isReadOnly: isReadOnly
  }, userConfig.data.apiKey, callback)
}

module.exports = new Mongo()
