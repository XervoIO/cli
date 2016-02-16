const Async = require('async');
const Util = require('util');

const Modulus = require('../modulus');
const AddOnController = require('../controllers/addOn');
const ProjectController = require('../controllers/project');
const ProjectCommands = require('../commands/project');
const UserConfig = require('../common/api').userConfig;
const Errors = require('../common/error');

var addOn = {};
var print = Modulus.io.print;

// ----------------------------------------------------------------------------
// Gets a project via project name param or project prompt
// ----------------------------------------------------------------------------
addOn.getProject = function (projectName, callback) {
  ProjectController.find({
    userId: UserConfig.data.userId
  },
  function (err, projects) {
    if (err) {
      err = Errors.handleApiError(err, 'GET_PROJECTS', callback);

      if (err.length > 0) return callback(err);
    }

    if (projects.length === 0) {
      return callback('You currently have no projects. One can be created using the create command.');
    }

    ProjectCommands.chooseProjectPrompt(
      projects, projectName, function (err, result) {
        if (err) return callback(err);
        if (!result) return callback('You must select a project.');
        callback(null, result);
      });
  });
};

// ----------------------------------------------------------------------------
// Prompts to choose an addon from a list
// ----------------------------------------------------------------------------
addOn.chooseAddOnPrompt = function (addons, callback) {
  var i;
  if (addons.length === 0) {
    return callback('This project has no provisioned add-ons.');
  }

  print('Please choose an add-on:'.input);

  for (i = 0; i < addons.length; ++i) {
    print(('  ' + (i + 1) + ') ' + addons[i].addon_name).input);
  }

  Modulus.io.prompt.get([{
    name: 'addon',
    description: 'Addon?',
    type: 'number',
    warning: 'Add-On choice has to be between 1 and ' + addons.length,
    minimum: 1,
    maximum: addons.length
  }], function (err, result) {
    if (err) return Errors.handlePromptError(err, callback);

    print(
      Util.format('Selecting %s\n', addons[result.addon - 1].addon_name.data)
    );

    callback(null, addons[result.addon - 1]);
  });
};

// ----------------------------------------------------------------------------
// Prompts to choose an add-on region from a list
// ----------------------------------------------------------------------------
addOn.chooseRegionPrompt = function (addon, callback) {
  var i;
  if (!addon.regions || addon.regions.length === 0) {
    return callback(null, '');
  }

  if (addon.regions.length === 1) {
    return callback(null, addon.regions[0]);
  }

  print('Please choose a region:'.input);

  for (i = 0; i < addon.regions.length; ++i) {
    print(('  ' + (i + 1) + ') ' + addon.regions[i]).input);
  }

  Modulus.io.prompt.get([
    {
      name: 'region',
      description: 'Region?',
      type: 'number',
      warning: 'Region choice has to be between 1 and ' + addon.regions.length,
      minimum: 1,
      maximum: addon.regions.length
    }
  ], function (err, result) {
    if (err) return Errors.handlePromptError(err, callback);
    print(Util.format('Select %s\n', addon.regions[result.region - 1].data));
    callback(null, addon.regions[result.region - 1]);
  });
};

// ----------------------------------------------------------------------------
// Prints a list of Add-Ons
// ----------------------------------------------------------------------------
addOn.printList = function (projectName, addons) {
  var i, addonConfig, configItem;
  print('Add-Ons provisioned for ' + projectName.verbose);

  if (addons instanceof Array === false || addons.length === 0) {
    print('No Add-Ons provisioned.');
  } else {
    for (i = 0; i < addons.length; ++i) {
      print('--------------------------------------'.grey);

      // Capitalized name.
      print(addons[i].addon_name.yellow);

      // Id
      print(('Id: ' + addons[i].addon_id).grey);

      // Plan
      print(('Plan: ' + addons[i].plan).grey);

      // Config
      addonConfig = addons[i].config;
      for (configItem in addonConfig) {
        if ({}.hasOwnProperty.call(addonConfig, configItem)) {
          print((configItem + ' = ' + addonConfig[configItem]).grey);
        }
      }
    }
  }
};

// ----------------------------------------------------------------------------
// Gets the Add-Ons provided to a project.
// ----------------------------------------------------------------------------
addOn.getForProject = function (projectName, callback) {
  var project = null;

  Async.waterfall([
    function (cb) {
      addOn.getProject(projectName, cb);
    },

    function (pro, cb) {
      project = pro;
      AddOnController.getForProject(project.id, cb);
    },

    function (addons, cb) {
      print('\n');

      addOn.printList(project.name, addons);
      cb(null);
    }
  ],
  function (err) {
    callback(err);
  });
};

// ----------------------------------------------------------------------------
// Provisions the specified add-on for the specified project.
// ----------------------------------------------------------------------------
addOn.provision = function (projectName, addon, callback) {
  var project;
  if (typeof addon !== 'string' || addon.length === 1) {
    return callback(
      'Please provide an add-on and plan. Use --help for the command format.'
    );
  }

  addon = addon.split(':');

  if (addon.length === 1) {
    return callback('A plan is required to provision an add-on.');
  }

  Async.waterfall([
    function (cb) {
      addOn.getProject(projectName, cb);
    },

    function (pro, cb) {
      project = pro;
      AddOnController.getById(addon[0], cb);
    },

    function (addonData, cb) {
      addOn.chooseRegionPrompt(addonData, cb);
    },

    function (region, cb) {
      AddOnController.provision(
        project.creator, project.id, addon[0], addon[1], region, cb
      );
    },

    function (add, cb) { // FIXME: ignores add;
      AddOnController.getForProject(project.id, cb);
    },

    function (addons) {
      print('\n');

      addOn.printList(project.name, addons);

      print();
      Modulus.io.success('Add-On \'' + addon[0] + '\' provisioned.');
    }
  ],
  function (err) {
    if (err) err = Errors.handleApiError(err, 'PROVISION_ADDON', callback);
    if (err.length > 0) return callback(err);
  });
};

addOn.deprovision = function (projectName, addOnId, callback) {
  var project, addon;

  Async.waterfall([
    function (cb) {
      addOn.getProject(projectName, cb);
    },

    function (pro, cb) {
      project = pro;
      AddOnController.getForProject(project.id, cb);
    },

    function (addons, cb) {
      var i;
      if (addOnId) {
        for (i = 0; i < addons.length; ++i) {
          if (addons[i].addon_id === addOnId) {
            return cb(null, addons[i]);
          }
        }
      }

      addOn.chooseAddOnPrompt(addons, cb);
    },

    function (add, cb) {
      addon = add;
      AddOnController.deprovision(project.id, addon.modulus_id, cb);
    }
  ],
  function (err) {
    var msg = 'Add-On ' + addon.addon_name.data + ' has been deprovisioned.';
    if (!err) print(msg);
    callback(err);
  });
};

module.exports = addOn;
