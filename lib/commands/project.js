var modulus = require('../modulus'),
    librarian = require('../common/api').librarian,
    async = require('async'),
    userConfig = require('../common/api').userConfig,
    error = require('../common/error');

var project = {};

project.deploy = function(cb) {
  librarian.project.find({
      userId : userConfig.data.userId
    },
    function(err, projects) {
      if(err) {
        return error.handleApiError(err);
      }
      if(projects.length === 0) {
         modulus.io.error('You currently have no projects. Please create one on the website');
         return cb();
      }
      project._chooseProjectPrompt(projects, function(err, result) {
        if(!result) {
          return cb('You must deploy to a project.');
        }
        return cb();
      });
  });
};

project._chooseProjectPrompt = function(projects, cb) {
  if(projects.length === 1) {
    var project = projects[0];
    modulus.io.prompt.get([{
      name : 'confirm',
      description : 'Are you sure you want to deploy to ' + project.name.data + '?',
      message : 'Acceptable response is "yes" or "no".',
      pattern : /^[yntf]{1}/i,
      default : 'yes'
    }], function(err, result) {
      if(err) {
        return error.handlePromptError(err, cb);
      }
      var y = /^[yt]{1}/i.test(result.confirm);
      var p = y ? project : null;
      return cb(null, p);
    });
  } else {
    modulus.io.print('Please choose which project to deploy to:'.input);
    for(var i = 0, len = projects.length; i < len; i++) {
      var index = i + 1;
      modulus.io.print(index.input + ') '.input + projects[i].name.input);
    }
    modulus.io.prompt.get([{
      name : 'project',
      description : 'Project Number?',
      warning : 'Project number has to be between 1 and ' + projects.length,
      type : 'integer',
      minimum : 1,
      maximum : projects.length
    }], function(err, result) {
      if(err) {
        return error.handlePromptError(err, cb);
      }
      return cb(null, projects[result.project - 1]);
    });
  }
};

module.exports = project;