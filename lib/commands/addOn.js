var modulus = require('../modulus'),
    addOnController = require('../controllers/addOn'),
    projectController = require('../controllers/project'),
    projectCommands = require('../commands/project'),
    async = require('async'),
    userConfig = require('../common/api').userConfig,
    error = require('../common/error'),
    util = require('util');

var addOn = {};

//-----------------------------------------------------------------------------
// Gets a project via project name param or project prompt
//-----------------------------------------------------------------------------
addOn.getProject = function(projectName, callback) {
  projectController.find({
    userId : userConfig.data.userId
  },
  function(err, projects) {
    if(err) {
      err = error.handleApiError(err, 'GET_PROJECTS', callback);

      if(err.length > 0) {
        return callback(err);
      }
    }
    
    if(projects.length === 0) {
      return callback('You currently have no projects. One can be created using the create command.');
    }
    
    projectCommands.chooseProjectPrompt(projects, projectName, function(err, result) {
      if(err) {
        err = error.handleApiError(err, 'CHOOSE_PROJECT', callback);
        
        if(err.length > 0) {
          return callback(err);
        }
      }
      
      if(!result) {
        return callback('You must select a project.');
      }

      callback(null, result);
    });
  });
};

//-----------------------------------------------------------------------------
// Prints a list of Add-Ons
//-----------------------------------------------------------------------------
addOn.printList = function(projectName, addons) {
  modulus.io.print('Add-Ons provisioned for ' + projectName.verbose);

  if(addons instanceof Array === false || addons.length === 0) {
    modulus.io.print('No Add-Ons provisioned.');
  } else {
    var name;
    for(var a = 0; a < addons.length; a++) {
      modulus.io.print('--------------------------------------'.grey);

      //Capitialized name
      modulus.io.print((addons[a].addon_id.charAt(0).toUpperCase() + addons[a].addon_id.slice(1)).yellow);

      //Plan
      modulus.io.print(('Plan: ' + addons[a].plan).grey);

      //Config
      for(var i = 0; i < addons[a].config.length; i++) {
        for(var p in addons[a].config[i]) {
          modulus.io.print((p + ' = ' + addons[a].config[i][p]).grey);
        }
      }
    }
  }
};

//-----------------------------------------------------------------------------
// Prints a config for an addon
//-----------------------------------------------------------------------------
addOn.printConfig = function(config) {

};

//-----------------------------------------------------------------------------
// Gets the Add-Ons provided to a project.
//-----------------------------------------------------------------------------
addOn.getForProject = function(projectName, callback) {
  var project = null;

  async.waterfall([
    function(cb) {
      addOn.getProject(projectName, cb);
    },

    function(pro, cb) {
      project = pro;
      addOnController.getForProject(project.id, cb);
    },

    function(addons, cb) {
      //Newline
      console.log();
      
      addOn.printList(project.name, addons);
      cb(null);
    }
  ], 
  function(err, project) {
    callback(err);
  });
};

module.exports = addOn;