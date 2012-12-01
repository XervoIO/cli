var modulus = require('../modulus'),
    async = require('async'),
    userConfig = require('../common/api').userConfig,
    error = require('../common/error'),
    projectController = require('../controllers/project'),
    fs = require('fs');

var env = {};

env.get = function(name, cb) {
  env._getAndChooseProject(function(err, project) {
    if(err) { return cb(err); }

    for (var i = 0; i < project.envVars.length; i++) {
      if(project.envVars[i].name === name) {
        env._printEnv(project.envVars[i]);
        return cb();
      }
    }

    return cb('Variable ' + name.yellow + ' not found in project ' + project.name.data);
  });
};

env.list = function(cb) {
  env._getAndChooseProject(function(err, project) {
    if(err) { return cb(err); }

    modulus.io.print("Project " + project.name.data + " Environment Variables");
    for (var i = 0; i < project.envVars.length; i++) {
      env._printEnv(project.envVars[i]);
    }
    return cb();
  });
};

env.set = function(name, value, cb) {
  env._getAndChooseProject(function(err, project) {
    if(err) { return cb(err); }

    var newEnv = {name : name, value : value};
    var found = false;
    modulus.io.print("Setting " + newEnv.name.yellow + " for project " + project.name.data);
    for (var i = 0; i < project.envVars.length; i++) {
      if(project.envVars[i].name === newEnv.name) {
        project.envVars[i].value = newEnv.value;
        found = true;
      }
    }
    if(!found) {
      project.envVars.push(newEnv);
    }

    projectController.saveVars(project.id, project.envVars, function(err, res) {
      if(err) {
        err = error.handleApiError(err, 'SET_VARS', cb);
        if(err.length > 0) {
          return cb(err);
        }
      }
      modulus.io.success('Successfully set environment variable.');
      return cb();
    });
  });
};

env.delete = function(name, cb) {
  env._getAndChooseProject(function(err, project) {
    if(err) { return cb(err); }

    var found = false;
    modulus.io.print("Deleting " + name.yellow + " for project " + project.name.data);
    for (var i = 0; i < project.envVars.length; i++) {
      if(project.envVars[i].name === name) {
        project.envVars.splice(i, 1);
        found = true;
        break;
      }
    }

    if(!found) {
      return cb('Variable ' + name.yellow + ' not found in project ' + project.name.data);
    }

    projectController.saveVars(project.id, project.envVars, function(err, res) {
      if(err) {
        err = error.handleApiError(err, 'SET_VARS', cb);
        if(err.length > 0) {
          return cb(err);
        }
      }

      modulus.io.success('Successfully deleted variable ' + name.yellow + ' from project ' + project.name.data);
      return cb();
    });
  });
};

env._getAndChooseProject = function(cb) {
  projectController.find({
      userId : userConfig.data.userId
    },
    function(err, projects) {
      if(err) {
        err = error.handleApiError(err, 'GET_PROJECTS', cb);
        if(err.length > 0) {
          return cb(err);
        }
      }
      if(projects.length === 0) {
        return cb('You currently have no projects. You can create one with "project create".');
      }
      modulus.commands.project.chooseProjectPrompt(projects, function(err, result) {
        if(err) {
          return cb('Could not choose project.');
        }
        if(!result) {
          return cb('You must choose a project.');
        }
        projectController.find({projectId : result.id}, function(err, project) {
          if(err) {
            err = error.handleApiError(err, 'FIND_PROJECT', cb);
            if(err.length > 0) {
              return cb(err);
            }
          }

          if(!result) {
            return cb('No project found.');
          }
          return cb(null, project);
        });
      });
  });
};

env._printEnv = function(env) {
  modulus.io.print(env.name.yellow + " = " + env.value.grey);
};

module.exports = env;