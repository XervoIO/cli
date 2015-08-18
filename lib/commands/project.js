/*
 * Copyright (c) 2014 Modulus
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 */

var fs                = require('fs');
var path              = require('path');
var util              = require('util');
var _                 = require('underscore');
var URL               = require('url');

var async             = require('async');
var findFileSync      = require('find-file-sync');
var createTable       = require('text-table');

var modulus           = require('../modulus');
var projectController = require('../controllers/project');
var imagesController  = require('../controllers/images');
var userController    = require('../controllers/user');

var userConfig        = require('../common/api').userConfig;
var error             = require('../common/error');
var verify            = require('../common/verifyPackage');

var project           = {};
var autoCmds          = ['start', 'deploy', 'env set'];
var uploadTries       = 0;
var uploadTriesMax    = 5;

// Find the index for the specified project in the specified projects array.
//    Returns -1 if not found.
//
var projectInArray = function (projects, name) {
  var project;

  for (var i = 0; project = projects[i]; i++) {
    if (project.name.toUpperCase() === name.toUpperCase()) return i;
  }

  return -1;
};

//
// Sort images by name.
//
function sortImages(images) {
  images.forEach(function (image) {
    var index = ['Node.js', 'Java', 'PHP', 'Static'].indexOf(image.label);

    // Default to sort order of 99 rather than -1 to ensure that new
    //    images are added to the end of the list.
    image.sortOrder = index >= 0 ? index : 99;
  });

  images.sort(function (a, b) {
    return a.sortOrder > b.sortOrder;
  });

  return images;
}

project.stop = function (projectName, cb) {
  project.stopStartRestart('stop', projectName, cb);
};

project.start = function (projectName, cb) {
  project.stopStartRestart('start', projectName, cb);
};

project.restart = function (projectName, cb) {
  project.stopStartRestart('restart', projectName, cb);
};

project.stopStartRestart = function (action, projectName, cb) {
  projectController.find({
      userId : userConfig.data.userId
    },
    function (err, projects) {
      if (err) {
        err = error.handleApiError(err, 'GET_PROJECTS', cb);
        if (err.length > 0) {
          return cb(err);
        }
      }
      if (projects.length === 0) {
        modulus.io.error('You currently have no projects. One can be created using the create command.');
        return cb();
      }
      project.cmd = action;
      project.chooseProjectPrompt(projects, projectName, function (err, result) {
        if (err) {
          return cb(err);
        }

        if (!result) {
          return cb('You must select a project.');
        }

        var func = null;
        var message = null;

        switch(action) {
          case 'restart' :
            func = projectController.restart;
            message = result.name + ' restarted at ' + result.domain;
            break;
          case 'stop' :
            func = projectController.stop;
            message = result.name + ' stopped';
            break;
          case 'start' :
            func = projectController.start;
            message = result.name + ' started at ' + result.domain;
            break;
        }

        func(result.id, function (err) {
          if (!err) {
            modulus.io.success(message);
          }
          cb(err);
        });
      });
    });
};

project.list = function (cb) {
  projectController.find({
      userId : userConfig.data.userId
    },
    function (err, projects) {
      var table = [];
      if (err) {
        err = error.handleApiError(err, 'PROJECT_LIST', cb);
        if (err.length > 0) {
          return cb(err);
        }
      }

      if (projects.length === 0) {
        modulus.io.print('You currently have no projects. You can create one with "project create".');
        return cb();
      }

      function colorStatus(stat) {
        switch (stat) {
          case 'NONE':
            return stat.input;
          case 'RUNNING':
            return stat.info;
          case 'STOPPED':
            return stat.error;
          case 'DEPLOYING':
          case 'UPLOADING':
          case 'STOPPING':
            return stat.warn;
          default:
            return stat;
        }
      }

      function getDomain(project) {
        var ret = '';

        if (project.customDomains.length > 0) {
          ret = project.customDomains[0].domain;
        } else {
          ret = project.domain;
        }

        ret = ret.replace('*.', '');

        return ret.indexOf('http') >= 0 ? ret : 'http://' + ret;
      }

      projects = _.sortBy(projects, 'creator');

      var userProjects = [];
      var orgProjects  = [];

      projects.forEach(function (project) {
        if (userConfig.data.userId === project.creator) {
          userProjects.push(project);
        } else {
          orgProjects.push(project);
        }
      });

      // make sure the current user's projects display first
      var proj = userProjects.concat(orgProjects);

      var owners = {};
      modulus.io.print('Current projects:'.input);
      async.mapSeries(proj, function (project, callback) {
        if (project.creator === userConfig.data.userId) {
          owners[project.creator] = userConfig.data.username;
          return callback(null, userConfig.data.username);
        }

        if (owners.hasOwnProperty(project.creator)) {
          return callback(null, owners[project.creator]);
        }

        userController.get(project.creator, function (err, user) {
          if (err) {
            if (err.errors && err.errors.length >= 1 &&
                err.errors[0].id === 'INVALID_AUTH') {
              // An invalid authorization error means that the user does not
              // have administrator access to the organization. In this case,
              // use a generic user header for the projects.
              owners[project.creator] = 'User ' + project.creator;
              return callback(null, 'User ' + project.creator);
            }

            return callback(err);
          }

          owners[project.creator] = user.username;
          return callback(null, user.username);
        });
      }, function (err, results) {
        if (err) {
          err = error.handleApiError(err, 'PROJECT_LIST', cb);
          if (err.length > 0) {
            cb(err);
          }

          return;
        }

        proj.forEach(function (project, index) {
          // display only one user/organization header
          if (owners[project.creator] === results[index]) {
            table.push([], [owners[project.creator].main], ['----------------------']);
            delete owners[project.creator];
          }

          table.push([
            project.name.data,
            project.images && project.images.run ? project.images.run.label : 'Node.js',
            colorStatus(project.status),
            getDomain(project)
          ]);
        });

        modulus.io.print(createTable(table));

        return cb(err);
      });
    }
  );
};

project.delete = function(projectName, cb) {
  async.waterfall([
    function getUserProjects (fn) {
      projectController.find({ userId: userConfig.data.userId }, function (err, results) {
        if (err) {
          return error.handleApiError(err, 'GET_PROJECTS', fn);
        }

        if (results.length === 0) {
          return error.handleApiError({ code: 'PROJECTS_NOT_FOUND' }, 'GET_PROJECTS', fn);
        }

        fn(null, results);
      });
    },
    function promptForProject (projects, fn) {
      if (projectName && projectInArray(projects, projectName) === -1) {
        modulus.io.error('Project not found');
        return fn(null, projects, null);
      }
      project.chooseProjectPrompt(projects, projectName, function(err, selectedProject) {
        if (err) {
          return error.handlePromptError(err, fn);
        }

        fn(null, selectedProject);
      });
    },
    function deleteProject(project, fn) {
      projectController.delete(project.id, function(err, result) {
        if (err) {
          err = error.handleApiError(err, 'DELETE_PROJECT', fn);
          if (err.length > 0) {
            return fn(err);
          }
        }

        modulus.io.success('Project ' + project.name + ' deleted.');
        fn(null, result);
      });
    }
  ], cb);
};

project.create = function (projectName, servoSize, runtime, cb) {
  var user, projects, images, imageTagIds = {};

  async.series([
    function getUser(fn) {
      userController.get(userConfig.data.userId, function (err, result) {
        if (err) {
          err = error.handleApiError(err, 'GET_PROJECTS', fn);
          if (err.length > 0) {
            return fn(err);
          }
        }

        user = result;
        fn();
      });
    },
    function findUserProjects(fn) {
      projectController.find({
        userId: userConfig.data.userId
      },
      function (err, result) {
        if (err) {
          err = error.handleApiError(err, 'GET_PROJECTS', fn);
          if (err.length > 0) {
            return fn(err);
          }
        }

        projects = result;

        if (projects.length >= parseInt(user.projectLimit, 10)) {
          return fn('You can not create any more projects at this time. You have reached your project limit.');
        }

        fn();
      });
    },
    function promptForProject(fn) {
      if (projectName && projectName !== '') {
        modulus.io.print('Creating project ' + projectName.data);
        return fn();
      }

      project._createProjectPrompt(function (err, result) {
        if (err) {
          return cb('Could not create project.');
        }

        projectName = result;
        fn();
      });
    },
    function getImages(fn) {
      imagesController.getAll(function (err, result) {
        if (err) {
          err = error.handleApiError(err, 'DEFAULT', fn);
          if (err.length > 0) {
            return fn(err);
          }
        }

        images = sortImages(result);

        fn();
      });
    },
    function promptForImage(fn) {
      function getImageTag (label, type) {
        var ret = '';

        images.forEach(function (image) {
          if (image.label.toLowerCase() === label.toLowerCase()) {
            image.tags.forEach(function (tag) {
              if ('latest' === tag.name && type === image.type) {
                ret = tag.id;
              }
            });
          }
        });

        return ret;
      }

      if (runtime) {
        imageTagIds.run = getImageTag(runtime, 'run');
        imageTagIds.build = getImageTag(runtime, 'build');

        if (!imageTagIds.run || !imageTagIds.build) {
          return fn('Invalid runtime selected');
        }

        return fn();
      }

      modulus.io.print('Please choose which runtime to use:'.input);
      var filteredImages = images.filter(function (image) {
        return 'run' === image.type && image.official;
      });

      filteredImages.forEach(function (image, index) {
        var out = '  ' + (index + 1) + ') ' + image.label;

        if ('stable' !== image.stability) {
          out += (' (' + (image.stability || 'beta') + ')').input;
        }

        modulus.io.print(out);
      });

      modulus.io.prompt.get([{
        name        : 'runtime',
        description : 'Image number?',
        required    : true,
        type        : 'number',
        minimum     : 1,
        maximum     : filteredImages.length
      }],
      function (err, result) {
        if (err) {
          return error.handlePromptError(err, fn);
        }

        imageTagIds.run = getImageTag(filteredImages[result.runtime - 1].label, 'run');
        imageTagIds.build = getImageTag(filteredImages[result.runtime - 1].label, 'build');

        fn();
      });
    },
    function promptForServoSize(fn) {
      if (servoSize && servoSize.length > 0) {
        return fn();
      }

      modulus.io.prompt.get([{
        name        : 'servoSize',
        description : 'Enter a servo size in MB [192, 396, 512, 1024, or 2048] (optional, default 512):',
        message     : 'Servo size should be a number (192, 396, 512, 1024, 2048) or empty',
        required    : false,
        pattern     : /^\d+$/
      }],
      function (err, result) {
        if (err) {
          return error.handlePromptError(err, cb);
        }

        servoSize = result.servoSize || 512;
        fn();
      });
    }
  ],
  function createProject(err) {
    if (err) {
      return cb(err);
    }

    projectController.create(
      projectName,
      user.id,
      servoSize,
      imageTagIds,
      function (err, project) {
        if (err) {
          err = error.handleApiError(err, 'CREATE_PROJECT', cb);

          if (err.length > 0) {
            return cb(err);
          }
        }

        if (!project) {
          return cb('Could not create project. Error from server.');
        }

        modulus.io.success('New project ' + projectName.data + ' created.');
        return cb(null, project);
      });
  });
};

//-----------------------------------------------------------------------------
/**
 * Deploys a project.
 * @param {string} projectName Name of the project to deploy. Specifying this skips prompts.
 * @param {string} dir The path to deploy. If not specified defaults to current directory.
 * @param {boolean} includeModules Whether or not to include node_modules directory in upload.
 * @param {string} registry npm registry url.
 * @param {boolean} meteorDebug Value indicating whether to override meteor debug mode.
 * @param {boolean} withTests Value indicating whether to run tests for the project on deploy.
 * @param {function} cb The callback.
 */
//-----------------------------------------------------------------------------
project.deploy = function (projectName, dir, includeModules, registry, meteorDebug, withTests, cb) {
  if (typeof dir !== 'string') {
    dir = process.cwd();
  }

  verify(dir, function (err, probs) {
    if (err) {
      return cb(err);
    }

    if (probs && probs.length) {
      var isFatal = false;
      modulus.io.print('');

      probs.forEach(function (problem) {
        isFatal = isFatal || problem.level === 'FATAL';

        if (problem.level === 'FATAL')
          modulus.io.error(problem.message);
        else
          modulus.io.warning(problem.message);
      });

      if (isFatal) return cb('There were problems with your project\'s package.json.');
    }
  });

  if (registry) {
    var url = URL.parse(registry);

    if (!url.protocol) {
      return cb('You must specify the protocol for the registry URL.');
    }
    if (!url.hostname) {
      return cb('Invalid registry URL.');
    }
  }

  project.cmd = 'deploy';

  dir = path.resolve(dir);
  dir = dir.replace(/\\/g, '/');
  if (!fs.existsSync(dir)) {
    return cb('Directory "' + dir + '" does not exist.');
  } else {
    project.dir = dir;
  }

  async.waterfall([
    function getUserProjects (fn) {
      projectController.find({ userId: userConfig.data.userId }, function (err, projects) {
        if (err) {
          return error.handleApiError(err, 'GET_PROJECTS', fn);
        }

        if (projects.length === 0) {
          return error.handleApiError({ code: 'PROJECTS_NOT_FOUND' }, 'GET_PROJECTS', fn);
        }

        fn(null, projects);
      });
    },
    function promptForProject (projects, fn) {
      if (projectName && projectInArray(projects, projectName) === -1) {
        return fn(null, projects, null);
      }
      project.chooseProjectPrompt(projects, projectName, function(err, selectedProject) {
        fn(err, projects, selectedProject);
      });
    },
    function verifyProjectExists (projects, selectedProject, fn) {
      if (selectedProject) {
        return fn(null, selectedProject);
      }
      modulus.io.prompt.get([{
        name : 'createProject',
        description : 'Project ' + projectName + ' not found, do you want to create it?',
        message : 'Acceptable response is "yes" or "no".',
        pattern : /^[yntf]{1}/i,
        default: 'no'
      }], function (err, result) {
        if (err) {
          return error.handleApiError(err, 'CONFIRM_CREATE_PROJECT', fn);
        }
        var answer = /^[yt]{1}/i.test(result.createProject);
        if (answer) {
          return project.create(projectName, null, null, function (err, project) {
            fn(null, project);
          });
        }
        return error.handleApiError({ code: 'NO_MATCHING_NAME' }, 'CHOOSE_PROJECT_PROMPT', fn);
      });
    },
    function deployProject (selectedProject, fn) {
      if (!selectedProject) {
        return fn('You must deploy to a project.');
      }
      projectController.deploy(selectedProject.id, dir, includeModules, registry, meteorDebug, withTests, function (err, domain) {
        if (!err) {
          modulus.io.success(selectedProject.name + ' running at ' + domain);
          fn();
        } else {
          projectController.status(selectedProject.id, function (e, status) {
            if (e) {
              return error.handleApiError(e, 'DEPLOY_PROJECT', fn);
            }

            //get the max upload retries
            uploadTriesMax = userConfig.data.upload_retry || uploadTriesMax;

            if (status === 'UPLOADING' && uploadTries < uploadTriesMax) {
              uploadTries++;
              modulus.io.error(util.format('Upload Failed. Retrying. (%s/%s)', uploadTries, uploadTriesMax));
              project.deploy(selectedProject.name, dir, includeModules, registry, meteorDebug, fn);
            } else {
              fn(err);
            }
          });
        }
      });
    }
  ], cb);
};

//-----------------------------------------------------------------------------
/**
 * Description - Gets the logs for a specific project. May download or print to console.
 * @param {string} projectName - name of the project to retrieve logs from.
 * @param {string} download - flag to swap between printing and downloading logs.
 * @param {string} output - filename to download the tarball at
 * @param {string} dir - directory to download to
 * @param {function} cb Callback invoked with log data.
 */
//-----------------------------------------------------------------------------
project.getLogs = function (projectName, download, output, dir, cb) {
  if (typeof dir !== 'string') {
    dir = process.cwd();
  }
  dir = path.resolve(dir);
  dir = dir.replace(/\\/g, '/');
  if (!fs.existsSync(dir)) {
    return cb('Directory "' + dir + '" does not exist.');
  }

  projectController.find({
      userId : userConfig.data.userId
    },
    function (err, projects) {
      if (err) {
        err = error.handleApiError(err, 'GET_PROJECT_LOGS', cb);
        if (err.length > 0) {
          return cb(err);
        }
      }
      if (projects.length === 0) {
        modulus.io.error('You currently have no projects. You can create one with "project create".');
        return cb();
      }

      var selectedProject = null;

      project.chooseProjectPrompt(projects, projectName, function (err, result) {
        if (err) {
          return cb(err);
        }

        if (!result) {
          return cb('You must select a project.');
        }

        selectedProject = result;

        if (result.status !== 'RUNNING'){
          return cb('Your project is not running. Please start your project to retrieve logs.');
        }
        if (download){
          projectController.downloadLogs(result.id, result.name, output, function (err, res) {
            if (!err){
              modulus.io.success(res.msg);
            } else {
              modulus.io.error('Problem downloading logs.');
            }
            cb(err);
          });
        } else{
          projectController.getLogs(selectedProject.id, function (err, logs) {

            if (err) return cb(err);

            if (logs.length === 1) {
              modulus.io.print(logs[0].log);
              modulus.io.success('Logs successfully retrieved.');
              cb();
            } else if (logs.length > 0) {

              project.chooseServoPrompt(selectedProject, false, function (err, servo) {
                if (err) {
                  return cb(err);
                }

                for(var i = 0; i < logs.length; i++) {
                  if (logs[i].servo.id === servo.id) {
                    modulus.io.print(logs[i].log);
                    modulus.io.success('Logs successfully retrieved for servo ' + servo.id);
                    return cb();
                  }
                }

                modulus.io.print('No log data.');

              });
            }
          });
        }
      });
    }
  );
};

//-----------------------------------------------------------------------------
/**
 * Description - Wipes the logs for a specific project
 * @param {string} projectName - name of the project to retrieve logs from.
 * @param {function} cb - Callback invoked with log data.
 */
 //--------------------------------------------------------------------
project.clearLogs = function (projectName, cb) {
  projectController.find({
      userId : userConfig.data.userId
    },
    function (err, projects) {
      if (err) {
        err = error.handleApiError(err, 'GET_PROJECT_LOGS', cb);
        if (err.length > 0) {
          return cb(err);
        }
      }
      if (projects.length === 0) {
        modulus.io.error('You currently have no projects. You can create one with "project create".');
        return cb();
      }
      project.chooseProjectPrompt(projects, projectName, function (err, result) {
        if (err) {
          return cb(err);
        }

        if (!result) {
          return cb('You must select a project.');
        }

        if (result.status !== 'RUNNING'){
          return cb('Your project is not running. Please start your project to clear logs.');
        }

        projectController.clearLogs(result.id, function (err) {
          if (!err){
            modulus.io.success('Logs successfully cleared.');
          } else {
            modulus.io.error('Failed to clear logs.');
          }
          cb(err);
        });
      });
    }
  );
};

/** Description - Streams logs for a specific project
 * @param {string} projectName - name of the project to retrieve logs from.
 * @param {function} cb - Callback invoked with stream data
**/
//--------------------------------------------------------------------
project.streamLogs = function (projectName, selectedServo, cb){
  projectController.find({
      userId : userConfig.data.userId
    },
    function (err, projects) {
      if (err) {
        err = error.handleApiError(err, 'GET_PROJECT_LOGS', cb);
        if (err.length > 0) {
          return cb(err);
        }
      }
      if (projects.length === 0) {
        modulus.io.error('You currently have no projects. You can create one with "project create".');
        return cb();
      }
      project.chooseProjectPrompt(projects, projectName, function (err, result) {
        if (err) {
          return cb(err);
        }

        if (!result) {
          return cb('You must select a project.');
        }

        if (result.status !== 'RUNNING'){
          return cb('Your project is not running. Please start your project to stream logs.');
        }

        var selectedProject = result;
        var selectedServos = selectedProject.pus[0];

        var go = function () {
          projectController.streamLogs(selectedProject.id, selectedServos, function () {
            modulus.io.error('Disconnected from stream.');
          });
        };

        if (selectedProject.pus.length === 1) {
          return go();
        }

        if (selectedServo) {
          if (selectedServo === 0) {
            selectedServos = selectedProject.pus;
          }
          else {
            selectedServo--;
            if (!selectedProject.pus[selectedServo]) {
              return error.handleApiError({ code: 'INVALID_SERVO_SELECTED' }, 'CHOOSE_SERVO_PROMPT', cb);
            }
            selectedServos = selectedProject.pus[selectedServo];
          }
          return go();
        }

        project.chooseServoPrompt(selectedProject, true, function (err, servos) {
          if (err) {
            return cb(err);
          }

          selectedServos = servos;
          return go();
        });
      });
    }
  );
};

/**
 * Figures out the format of the scale options provided by the user. Valid formats are:
 * $ modulus project scale #
 * $ modulus project scale aws.us-east-1a=# joyent.us-east-1=#, etc.
 * @param {Array} instances The instances to convert to scale options.
 * @returns {Array} scaleOptions ready for API call. Null if invalid.
 */
project.getScaleOptions = function (instances) {
  if (!instances || instances.length === 0) {
    return null;
  }

  // Length is one, user could have specified a single number.
  if (instances.length === 1) {
    var num = parseInt(instances[0], 10);

    // User specified a single number. We're done.
    if (!isNaN(num)) {
      return { instances: num };
    }
  }

  var result = [];
  // Each instance is an iaas.region combo. Break it apart.
  for(var idx = 0; idx < instances.length; idx++) {
    var instance = instances[idx];
    var dotIdx = instance.indexOf('.');
    var equalIdx = instance.indexOf('=');

    // There's no dot or equals. Invalid format.
    if (dotIdx < 0 || equalIdx < 0) {
      return null;
    }

    var iaas = instance.substring(0, dotIdx);
    var region = instance.substring(dotIdx + 1, equalIdx);
    var count = parseInt(instance.substr(equalIdx + 1), 10);

    // Count is not a number. Invalid format.
    if (isNaN(count)) {
      return null;
    }

    result.push({
      iaas: iaas,
      region: region,
      instances: count
    });
  }

  return result;
};

//--------------------------------------------------------------------
project.scale = function (instances, projectName, cb) {

  instances = project.getScaleOptions(instances);

  if (!instances) {
    modulus.io.error('Please specify the number of servos.');
    modulus.help.printUsage('scale');
    return cb();
  }

  projectController.find({
      userId : userConfig.data.userId
    },
    function (err, projects) {
      if (err) {
        err = error.handleApiError(err, 'SCALE_PROJECT', cb);
        if (err.length > 0) {
          return cb(err);
        }
      }

      if (projects.length === 0) {
        modulus.io.error('You currently have no projects. You can create one with "project create".');
        return cb();
      }

      project.chooseProjectPrompt(projects, projectName, function (err, result) {
        if (err) {
          return cb(err);
        }

        if (!result) {
          return cb('You must select a project.');
        }

        projectController.scale(
          result.id,
          instances,
          result.status.toLowerCase() === 'running',
          function (err) {
            if (!err) {
              modulus.io.success('Project successfully scaled.');
            }
            cb(err);
          });
      });
    });
};

//-------------------------------------------------------------------------------------------------
project._createProjectPrompt = function (cb) {
  modulus.io.prompt.get([{
    name : 'name',
    description : 'Enter a project name:',
    maxLength : 50,
    required : true
  }], function (err, results) {
    if (err) {
      return error.handlePromptError(err, cb);
    }
    cb(null, results.name);
  });
};

//-----------------------------------------------------------------------------
/**
 * Displays a prompt for choosing a servo.
 *
 * @param {Object}    project   The project object.
 * @param {Boolean}   multi     toggle allow multi servo selction
 * @param {Function}  cb
 */
//-----------------------------------------------------------------------------
project.chooseServoPrompt = function (project, multi, cb) {
  if (project.pus.length === 0) {
    return cb(null, null);
  }

  if (project.pus.length === 1) {
    return cb(null, project.pus[0]);
  }

  modulus.io.print('Please choose which servo to use:'.input);

  if (multi) {
    modulus.io.print('  0' + ') '.input + 'All');
  }

  var table = [];

  project.pus.forEach(function (pu, i) {
    var servoName = 'Servo: '.input;

    if (pu.host) {
      servoName += util.format(
        '%s (%s.%s),',
        pu.id,
        pu.host.iaas,
        pu.host.region);
    } else {
      servoName += pu.id + ',';
    }

    table.push([
      ('  ' + (i + 1).toString() + ')').main,
      servoName.main,
      ('Status: ' + pu.status).input
    ]);
  });

  modulus.io.print(createTable(table));

  var promptOptions = {
    name        : 'servo',
    description : 'Servo Number?',
    warning     : 'Servo number has to be between 1 and ' + project.pus.length,
    minimum     : 1,
    maximum     : project.pus.length,
    type        : 'number',
    required    : true
  };

  if (multi) {
    promptOptions.warning = 'Servo number has to be between 0 and ' + project.pus.length;
    promptOptions.minimum = 0;
  }

  modulus.io.prompt.get(promptOptions, function (err, answer) {
    if (err) {
      return error.handlePromptError(err, cb);
    }

    if (answer.servo === 0) {
      cb(null, project.pus);
    } else {
      cb(null, project.pus[answer.servo - 1]);
    }
  });
};

//-----------------------------------------------------------------------------
/**
 * Displays a prompt for choosing projects.
 * @param {Array} projects Array of user's projects.
 * @param {String} [projectName] Default selection.
 * @param {Function} cb
 */
//-------------------------------------------------------------------------------------------------
project.chooseProjectPrompt = function (projects, projectName, cb) {
  var projectIndex = -1,
      metaPath = null,
      foundPrint = 'Selecting %s\n';

  if (typeof projectName === 'function') {
    cb = projectName;
    projectName = null;
  }

  // Check for "mod-project-name" and set `projectName` to the result.
  metaPath = findFileSync(project.dir || process.cwd(), 'package.json', ['.git', 'node_modules']);
  if (metaPath && autoCmds.indexOf(project.cmd) >= 0) {
    var meta = null;

    try {
      meta = JSON.parse(fs.readFileSync(metaPath), 'utf8');
    } catch (e) {}

    if (meta && meta['mod-project-name'] && !projectName) {
      // "mod-project-name" found in package, check for the project name
      // in the list of projects to make sure it exists.
      projectIndex = projectInArray(projects, meta['mod-project-name']);

      if (projectIndex >= 0) {
        modulus.io.print('Found mod-project-name \'' + meta['mod-project-name'] + '\' in package.json');
        projectName = projects[projectIndex].name;
      }
    }
  }

  // A default selection has been made. See if a match exists in the collection.
  // prevents crashes when -p is flagged but no name is given
  if (typeof projectName === 'string') {
    projectIndex = projectInArray(projects, projectName);

    if (projectIndex >= 0) {
      modulus.io.print(util.format(foundPrint, projectName.data));
      return cb(null, projects[projectIndex]);
    }

    // No match was found. Error out.
    return error.handleApiError({ code: 'NO_MATCHING_NAME' }, 'CHOOSE_PROJECT_PROMPT', cb);
  }

  if (projects.length === 1) {
    var selectedProject = projects[0];
    modulus.io.prompt.get([{
      name : 'confirm',
      description : 'Are you sure you want to use project ' + selectedProject.name.data + '?',
      message : 'Acceptable response is "yes" or "no".',
      pattern : /^[yntf]{1}/i,
      default : 'yes'
    }], function (err, result) {
      if (err) {
        return error.handlePromptError(err, cb);
      }
      var y = /^[yt]{1}/i.test(result.confirm);
      var p = y ? selectedProject : null;
      return cb(null, p);
    });
  } else {
    var table = [];
    modulus.io.print('Please choose which project to use:'.input);
    for(var i = 0, len = projects.length; i < len; i++) {
      var index = i + 1;
      table.push([
        ('  ' + index.toString() + ')').main,
        projects[i].name.main,
        projects[i].images && projects[i].images.run ?
          projects[i].images.run.label.input :
          'Node.js'.input
      ]);
    }

    modulus.io.print(createTable(table));
    modulus.io.prompt.get([{
      name : 'project',
      description : 'Project Number?',
      warning : 'Project number has to be between 1 and ' + projects.length,
      required : true,
      type : 'number',
      minimum : 1,
      maximum : projects.length
    }], function (err, result) {
      if (err) {
        return error.handlePromptError(err, cb);
      }
      modulus.io.print(util.format(foundPrint, projects[result.project - 1].name.data));
      return cb(null, projects[result.project - 1]);
    });
  }
};

module.exports = project;
