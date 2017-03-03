var librarian = require('../common/api').librarian
var userConfig = require('../common/api').userConfig
var apiUtil = require('../common/api').apiUtil
var Errors = require('../util/errors')

// -----------------------------------------------------------------------------
var AddOn = function () {

}

// -----------------------------------------------------------------------------
AddOn.prototype.getById = function (id, callback) {
  librarian.addOns.getById(id, function (err, addon) {
    if (err) {
      return callback(Errors.getMessage(err))
    }

    callback(null, addon)
  })
}

// -----------------------------------------------------------------------------
AddOn.prototype.getForProject = function (projectId, callback) {
  librarian.addOns.getByProject(projectId, userConfig.data.apiKey, function (err, addons) {
    if (err) {
      return callback(Errors.getMessage(err))
    }

    callback(null, addons)
  })
}

// -----------------------------------------------------------------------------
AddOn.prototype.getConfigVars = function (projectId, callback) {
  apiUtil.get('/projects/' + projectId + '/environment-variables', function (err, vars) {
    if (err) {
      return callback(Errors.getMessage(err))
    }

    callback(null, vars)
  })
}

// -----------------------------------------------------------------------------
AddOn.prototype.provision = function (userId, projectId, addOnId, plan, region, callback) {
  librarian.addOns.provision(userId, addOnId, plan, projectId, {}, region, userConfig.data.apiKey, function (err, addon) {
    if (err) {
      return callback(err)
    }

    callback(null, addon)
  })
}

AddOn.prototype.deprovision = function (projectId, xervoID, callback) {
  librarian.addOns.deprovision(projectId, xervoID, userConfig.data.apiKey, function (err) {
    if (err) {
      return callback(Errors.getMessage(err))
    }

    callback(null)
  })
}

module.exports = new AddOn()
