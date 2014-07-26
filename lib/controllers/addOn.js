var modulus = require('../modulus'),
    util = require('util'),
    librarian = require('../common/api').librarian,
    userConfig = require('../common/api').userConfig,
    Errors = require('../util/errors'),
    async = require('async');

//-----------------------------------------------------------------------------
var AddOn = function() {

};

//-----------------------------------------------------------------------------
AddOn.prototype.getById = function (id, callback) {
  librarian.addOns.getById(id, function (err, addon) {
    if (err) {
      return callback(Errors.getMessage(err));
    }

    callback(null, addon);
  });
};

//-----------------------------------------------------------------------------
AddOn.prototype.getForProject = function(projectId, callback){
  librarian.addOns.getByProject(projectId, userConfig.data.apiKey, function(err, addons) {
    if(err) {
      return callback(Errors.getMessage(err));
    }

    callback(null, addons);
  });
};

//-----------------------------------------------------------------------------
AddOn.prototype.getConfigVars = function(projectId, callback){
  librarian.addOns.getConfigVars(projectId, userConfig.data.apiKey, function(err, vars) {
    if(err) {
      return callback(Errors.getMessage(err));
    }

    callback(null, vars);
  });
};

//-----------------------------------------------------------------------------
AddOn.prototype.provision = function(projectId, addOnId, plan, region, callback) {
  librarian.addOns.provision(userConfig.data.userId, addOnId, plan, projectId, {}, region, userConfig.data.apiKey, function(err, addon) {
    if(err) {
      return callback(err);
    }

    callback(null, addon);
  });
};

AddOn.prototype.deprovision = function(projectId, modulusId, callback) {
  librarian.addOns.deprovision(projectId, modulusId, userConfig.data.apiKey, function(err) {
    if(err) {
      return callback(Errors.getMessage(err));
    }

    callback(null);
  });
};

module.exports = new AddOn();
