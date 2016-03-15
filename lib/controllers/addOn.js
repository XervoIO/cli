const Librarian = require('../common/api').librarian;
const UserConfig = require('../common/api').userConfig;
const Errors = require('../util/errors');

// ----------------------------------------------------------------------------
var AddOn = function () {

};

// ----------------------------------------------------------------------------
AddOn.prototype.getById = function (id, callback) {
  Librarian.addOns.getById(
    id, function (err, addon) {
      if (err) return callback(Errors.getMessage(err));
      callback(null, addon);
    });
};

// ----------------------------------------------------------------------------
AddOn.prototype.getForProject = function (projectId, callback) {
  Librarian.addOns.getByProject(
    projectId, UserConfig.data.apiKey, function (err, addons) {
      if (err) return callback(Errors.getMessage(err));
      callback(null, addons);
    });
};

// ----------------------------------------------------------------------------
AddOn.prototype.getConfigVars = function (projectId, callback) {
  Librarian.addOns.getConfigVars(
    projectId, UserConfig.data.apiKey, function (err, vars) {
      if (err) return callback(Errors.getMessage(err));
      callback(null, vars);
    });
};

// ----------------------------------------------------------------------------
AddOn.prototype.provision = function (userId, projectId, addOnId, plan, region, callback) {
  Librarian.addOns.provision(
    userId, addOnId, plan, projectId, {}, region, UserConfig.data.apiKey, function (err, addon) {
      if (err) return callback(err);
      callback(null, addon);
    });
};

AddOn.prototype.deprovision = function (projectId, modulusId, callback) {
  Librarian.addOns.deprovision(
    projectId, modulusId, UserConfig.data.apiKey, function (err) {
      if (err) return callback(Errors.getMessage(err));
      callback();
    });
};

module.exports = new AddOn();
