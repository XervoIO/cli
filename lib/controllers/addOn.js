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
AddOn.prototype.getForProject = function(projectId, callback){
  librarian.addOns.getByProject(projectId, userConfig.data.apiKey, function(err, addons) {
    if(err) {
      callback(Errors.getMessage(err));
    }

    callback(null, addons);
  });
};

module.exports = new AddOn();