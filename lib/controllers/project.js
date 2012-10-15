var librarian = require('../common/api').librarian,
    userConfig = require('../common/api').userConfig;

var Project = function() {

};

Project.prototype.create = function(name, creatorId, callback) {
  librarian.project.create({
    name: name,
    creator: creatorId
  }, userConfig.data.apiKey, callback);
};

Project.prototype.find = function(opts, callback) {
  librarian.project.find(opts, userConfig.data.apiKey, callback);
};

Project.prototype.saveVars = function(projectId, vars, callback) {
  librarian.project.saveVars(projectId, vars, userConfig.data.apiKey, callback);
};

module.exports = new Project();