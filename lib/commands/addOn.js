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
// Prompts to choose an addon from a list
//-----------------------------------------------------------------------------
addOn.chooseAddOnPrompt = function(addons, callback) {
  if(addons.length === 0) {
    callback('This project has no provisioned add-ons.');
  }

  modulus.io.print('Please choose an add-on:'.input);

  for(var a = 0; a < addons.length; a++) {
    modulus.io.print(('  '  + (a + 1) + ') ' + addons[a].addon_name).input);
  }

  modulus.io.prompt.get([{
    name : 'addon',
    description : 'Addon?',
    type: 'number',
    warning : 'Add-On choice has to be between 1 and ' + addons.length,
    minimum : 1,
    maximum : addons.length
  }], function(err, result) {
    if(err) {
      return error.handlePromptError(err, callback);
    }

    modulus.io.print(util.format('Selecting %s\n', addons[result.addon - 1].addon_name.data));
    callback(null, addons[result.addon - 1]);
  });
};

//-----------------------------------------------------------------------------
// Prompts to choose an add-on region from a list
//-----------------------------------------------------------------------------
addOn.chooseRegionPrompt = function (addon, callback) {
  if (!addon.regions || addon.regions.length === 0) {
    return callback(null, '');
  }

  if (addon.regions.length === 1) {
    return callback(null, addon.regions[0]);
  }

  modulus.io.print('Please choose a region:'.input);

  for (var i = 0; i < addon.regions.length; i++) {
    modulus.io.print(('  '  + (i + 1) + ') ' + addon.regions[i]).input);
  }

  modulus.io.prompt.get([
    {
      name: 'region',
      description: 'Region?',
      type: 'number',
      warning: 'Region choice has to be between 1 and ' + addon.regions.length,
      minimum: 1,
      maximum: addon.regions.length
    }
  ], function (err, result) {
      if (err) {
        return error.handlePromptError(err, callback);
      }

      modulus.io.print(util.format('Select %s\n', addon.regions[result.region - 1].data));
      callback(null, addon.regions[result.region - 1]);
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
    for(var a = 0; a < addons.length; a++) {
      modulus.io.print('--------------------------------------'.grey);

      // Capitalized name.
      modulus.io.print(addons[a].addon_name.yellow);

      // Id
      modulus.io.print(('Id: ' + addons[a].addon_id).grey);

      // Plan
      modulus.io.print(('Plan: ' + addons[a].plan).grey);

      // Config
      for(var k in addons[a].config) {
        modulus.io.print((k + ' = ' + addons[a].config[k]).grey);
      }
    }
  }
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
  function(err) {
    callback(err);
  });
};

//-----------------------------------------------------------------------------
// Provisions the specified add-on for the specified project.
//-----------------------------------------------------------------------------
addOn.provision = function(projectName, addon, callback) {
  if (typeof addon !== 'string' || addon.length === 1) {
    return callback('Please provide an add-on and plan. Use --help for the command format.');
  }

  addon = addon.split(':');

  if (addon.length === 1) {
    return callback('A plan is required to provision an add-on.');
  }

  var project, provisioned;
  async.waterfall([
    function(cb) {
      addOn.getProject(projectName, cb);
    },

    function(pro, cb) {
      project = pro;
      addOnController.getById(addon[0], cb);
    },

    function (addonData, cb) {
      addOn.chooseRegionPrompt(addonData, cb);
    },

    function (region, cb) {
      addOnController.provision(project.id, addon[0], addon[1], region, cb);
    },

    function(add, cb) {
      provisioned = add;
      addOnController.getForProject(project.id, cb);
    },

    function(addons) {

      //Newline
      console.log();

      addOn.printList(project.name, addons);

      console.log();
      modulus.io.success('Add-On \'' + addon[0] + '\' provisioned.');
    }
  ],
  function(err) {
    if (err) {
      err = error.handleApiError(err, 'PROVISION_ADDON', callback);
    }

    if (err.length > 0) {
      callback(err);
    }
  });
};

addOn.deprovision = function(projectName, addOnId, callback) {

  var project, addon;
  async.waterfall([
    function(cb) {
      addOn.getProject(projectName, cb);
    },

    function(pro, cb) {
      project = pro;
      addOnController.getForProject(project.id, cb);
    },

    function(addons, cb) {
      if(addOnId) {
        for(var a = 0; a < addons.length; a++) {
          if(addons[a].addon_id === addOnId) {
            return cb(null, addons[a]);
          }
        }
      }

      addOn.chooseAddOnPrompt(addons, cb);
    },

    function(add, cb) {
      addon = add;
      addOnController.deprovision(project.id, addon.modulus_id, cb);
    }
  ],
  function(err) {
    if(!err) {
      modulus.io.print('Add-On ' + addon.addon_name.data + ' has been deprovisioned.');
    }

    callback(err);
  });
};

module.exports = addOn;
