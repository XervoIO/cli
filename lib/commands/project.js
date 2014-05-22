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

var modulus = require('../modulus'),
    projectController = require('../controllers/project'),
    userController = require('../controllers/user'),
    async = require('async'),
    userConfig = require('../common/api').userConfig,
    error = require('../common/error'),
    archiver = require('archiver'),
    findFileSync = require('find-file-sync'),
    uuid = require('node-uuid'),
    fs = require('fs'),
    Ignore = require('fstream-ignore'),
    path = require('path'),
    util = require('util'),
    URL = require('url');

var project = {},
    autoCmds = ['start', 'deploy', 'env set'],
    uploadTries = 0,
    uploadTriesMax = 5;

// Find the index for the specified project in the specified projects array.
//    Returns -1 if not found.
//
var projectInArray = function(projects, name) {
  var project;

  for (var i = 0; project = projects[i]; i++) {
    if (project.name.toUpperCase() === name.toUpperCase()) return i;
  }

  return -1;
};

project.stop = function(projectName, cb) {
  project.stopStartRestart('stop', projectName, cb);
};

project.start = function(projectName, cb) {
  project.stopStartRestart('start', projectName, cb);
};

project.restart = function(projectName, cb) {
  project.stopStartRestart('restart', projectName, cb);
};

project.stopStartRestart = function(action, projectName, cb) {
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
         modulus.io.error('You currently have no projects. One can be created using the create command.');
         return cb();
      }
      project.cmd = action;
      project.chooseProjectPrompt(projects, projectName, function(err, result) {
        if(err) {
          err = error.handleApiError(err, action.toUpperCase() + '_PROJECT', cb);
          if(err.length > 0) {
            return cb(err);
          }
        }
        if(!result) {
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

        func(result.id, function(err, result) {
          if(!err) {
            modulus.io.success(message);
          }
          cb(err);
        });
      });
  });
};

project.list = function(cb) {
  projectController.find({
      userId : userConfig.data.userId
    },
    function(err, projects) {
      if(err) {
        err = error.handleApiError(err, 'PROJECT_LIST', cb);
        if(err.length > 0) {
          return cb(err);
        }
      }

      if(projects.length === 0) {
        modulus.io.print('You currently have no projects. You can create one with "project create".');
        return cb();
      }

      modulus.io.print('Current projects:'.input);

      for(var i = 0, len = projects.length; i < len; i++) {
        modulus.io.print(projects[i].name.data + ' (' + projects[i].domain + ')' + ' - ' + projects[i].status);
      }
      return cb();
    }
  );
};

project.create = function(projectName, cb) {
  async.parallel([
    function(callback) {
      userController.get(userConfig.data.userId, callback);
    },
    function(callback) {
      projectController.find({userId : userConfig.data.userId}, callback);
    }],
    function(err, results) {
      if(err) {
        err = error.handleApiError(err, 'GET_PROJECTS', cb);
        if(err.length > 0) {
          return cb(err);
        }
      }

      var user = results[0],
          projects = results[1];

      if (parseInt(user.projectLimit, 10) === projects.length) {
        return cb('You can not create any more projects at this time. You have reached your project limit.');
      }

      var createProject = function(pname) {
        projectController.create(
          pname,
          user.id,
          function(err, project) {
            if(err) {
              err = error.handleApiError(err, 'CREATE_PROJECT', cb);
              if(err.length > 0) {
                return cb(err);
              }
            }
            if(!project) {
              return cb('Could not create project. Error from server.');
            }
            modulus.io.success('New project ' + pname.data + ' created.');
            return cb();
        });
      }
      // If project name is passed do NOT prompt for name
      if(projectName && projectName !== '') {
        modulus.io.print('Creating project ' + projectName.data);
        createProject(projectName);
      } else {
        project._createProjectPrompt(function(err, name) {
          if(err) {
            return cb('Could not create project.');
          }
          createProject(name);
        });
      }
  });
};

//-----------------------------------------------------------------------------
/**
 * Deploys a project.
 * @param {string} projectName Name of the project to deploy. Specifying this skips prompts.
 * @param {string} dir The path to deploy. If not specified defaults to current directory.
 * @param {string} projectType The type of application being deployed.
 * @param {boolean} includeModules Whether or not to include node_modules directory in upload.
 * @param {string} nodeVersion The version of node to set when demeteorizing the project, if applicable.
 * @param {boolean} forceNpmInstall Value indicating whether to force an npm install.
 * @param {function} cb The callback.
 */
//-----------------------------------------------------------------------------
project.deploy = function(projectName, dir, projectType, includeModules, nodeVersion, forceNpmInstall, registry, cb) {
  if(typeof dir !== 'string') {
    dir = process.cwd();
  }

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
  if(!fs.existsSync(dir)) {
    return cb('Directory "' + dir + '" does not exist.');
  } else {
    project.dir = dir;
  }

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
         modulus.io.error('You currently have no projects. You can create one with "project create".');
         return cb();
      }

      project.chooseProjectPrompt(projects, projectName, function(err, result) {
        if(err) {
          err = error.handleApiError(err, 'DEPLOY_PROJECT', cb);
          if(err.length > 0) {
            return cb(err);
          }
        }

        if(!result) {
          return cb('You must deploy to a project.');
        }

        projectController.deploy(result.id, dir, projectType, includeModules, nodeVersion, forceNpmInstall, registry, function(err, domain) {
          if(!err) {
            modulus.io.success(result.name + ' running at ' + domain);
            cb();
          } else {
            projectController.status(result.id, function(e, status) {
              if(e) {
                console.log('status error');
                err = error.handleApiError(e, 'DEPLOY_PROJECT', cb);
                return cb(err);
              }

              //get the max upload retries
              uploadTriesMax = userConfig.data.upload_retry || uploadTriesMax;

              if(status === 'UPLOADING' && uploadTries < uploadTriesMax) {
                uploadTries++;
                modulus.io.error(util.format('Upload Failed. Retrying. (%s/%s)', uploadTries, uploadTriesMax));
                project.deploy(result.name, dir, projectType, includeModules, nodeVersion, forceNpmInstall, registry, cb);
              } else {
                cb(err);
              }
            });
          }
        });
      });
  });
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
project.getLogs = function(projectName, download, output, dir, cb) {
  if(typeof dir !== 'string') {
    dir = process.cwd();
  }
  dir = path.resolve(dir);
  dir = dir.replace(/\\/g, '/');
  if(!fs.existsSync(dir)) {
    return cb('Directory "' + dir + '" does not exist.');
  }

  projectController.find({
      userId : userConfig.data.userId
    },
    function(err, projects) {
      if(err) {
        err = error.handleApiError(err, 'GET_PROJECT_LOGS', cb);
        if(err.length > 0) {
          return cb(err);
        }
      }
      if(projects.length === 0) {
         modulus.io.error('You currently have no projects. You can create one with "project create".');
         return cb();
      }

      var selectedProject = null;

      project.chooseProjectPrompt(projects, projectName, function(err, result) {

        selectedProject = result;

        if(err) {
          err = error.handleApiError(err, 'GET_PROJECT_LOGS', cb);
          if(err.length > 0) {
            return cb(err);
          }
        }
        if(!result) {
          return cb('You must select a project.');
        }
        if(result.status !== 'RUNNING'){
          return cb('Your project is not running. Please start your project to retrieve logs.');
        }
        if(download){
          projectController.downloadLogs(result.id, result.name, output, function(err, res) {
            if(!err){
              modulus.io.success(res.msg);
            } else {
              modulus.io.error('Problem downloading logs.');
            }
            cb(err);
          });
        } else{
          projectController.getLogs(selectedProject.id, function(err, logs) {

            if(err) return cb(err);

            if(logs.length === 1) {
              modulus.io.print(logs[0].log);
              modulus.io.success('Logs successfully retrieved.');
              cb();
            } else if(logs.length > 0) {

              project.chooseServoPrompt(selectedProject, null, function(err, servo) {

                console.log(servo);

                if(err) {
                  return cb(err);
                }

                for(var i = 0; i < logs.length; i++) {
                  if(logs[i].servo.id === servo.id) {
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
project.clearLogs = function(projectName, cb) {
  projectController.find({
      userId : userConfig.data.userId
    },
    function(err, projects) {
      if(err) {
        err = error.handleApiError(err, 'GET_PROJECT_LOGS', cb);
        if(err.length > 0) {
          return cb(err);
        }
      }
      if(projects.length === 0) {
         modulus.io.error('You currently have no projects. You can create one with "project create".');
         return cb();
      }
      project.chooseProjectPrompt(projects, projectName, function(err, result) {
        if(err) {
          err = error.handleApiError(err, 'GET_PROJECT_LOGS', cb);
          if(err.length > 0) {
            return cb(err);
          }
        }
        if(!result) {
          return cb('You must select a project.');
        }
        if(result.status !== 'RUNNING'){
          return cb('Your project is not running. Please start your project to clear logs.');
        }
        projectController.clearLogs(result.id, function(err, res){
          if(!err){
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
project.streamLogs = function(projectName, cb){
  projectController.find({
      userId : userConfig.data.userId
    },
    function(err, projects) {
      if(err) {
        err = error.handleApiError(err, 'GET_PROJECT_LOGS', cb);
        if(err.length > 0) {
          return cb(err);
        }
      }
      if(projects.length === 0) {
         modulus.io.error('You currently have no projects. You can create one with "project create".');
         return cb();
      }
      project.chooseProjectPrompt(projects, projectName, function(err, result) {

        if(err) {
          err = error.handleApiError(err, 'GET_PROJECT_LOGS', cb);
          if(err.length > 0) {
            return cb(err);
          }
        }
        if(!result) {
          return cb('You must select a project.');
        }
        if(result.status !== 'RUNNING'){
          return cb('Your project is not running. Please start your project to stream logs.');
        }

        var selectedProject = result;
        var selectedServo = selectedProject.pus[0];

        var go = function(servoId) {
          projectController.streamLogs(selectedProject.id, selectedServo.id, function() {
            modulus.io.error('Disconnected from stream.');
          });
        };

        if(selectedProject.pus.length === 1) {
          return go();
        }

        project.chooseServoPrompt(selectedProject, null, function(err, servo) {
          if(err) {
            return cb(err);
          }

          selectedServo = servo;
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
project.getScaleOptions = function(instances) {
  if(!instances || instances.length === 0) {
    return null;
  }

  // Length is one, user could have specified a single number.
  if(instances.length === 1) {
    var num = parseInt(instances[0], 10);

    // User specified a single number. We're done.
    if(!isNaN(num)) {
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
    if(dotIdx < 0 || equalIdx < 0) {
      return null;
    }

    var iaas = instance.substring(0, dotIdx);
    var region = instance.substring(dotIdx + 1, equalIdx);
    var count = parseInt(instance.substr(equalIdx + 1), 10);

    // Count is not a number. Invalid format.
    if(isNaN(count)) {
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
project.scale = function(instances, cb) {

  var instances = project.getScaleOptions(instances);

  if(!instances) {
    modulus.io.error('Please specify the number of servos.')
    modulus.help.printUsage('scale');
    return cb();
  }

  projectController.find({
      userId : userConfig.data.userId
    },
    function(err, projects) {
      if(err) {
        err = error.handleApiError(err, 'SCALE_PROJECT', cb);
        if(err.length > 0) {
          return cb(err);
        }
      }
      if(projects.length === 0) {
         modulus.io.error('You currently have no projects. You can create one with "project create".');
         return cb();
      }
      project.chooseProjectPrompt(projects, function(err, result) {
        if(err) {
          err = error.handleApiError(err, 'SCALE_PROJECT', cb);
          if(err.length > 0) {
            return cb(err);
          }
        }
        if(!result) {
          return cb('You must select a project.');
        }

        projectController.scale(result.id, instances, function(err, result) {
          if(!err) {
            modulus.io.success('Project successfully scaled.');
          }
          cb(err);
        });
      });
  });
};

//-------------------------------------------------------------------------------------------------
project._createProjectPrompt = function(cb) {
  modulus.io.prompt.get([{
    name : 'name',
    description : 'Enter a project name:',
    maxLength : 50,
    required : true
  }], function(err, results) {
    if(err) {
      return error.handlePromptError(err, cb);
    }
    cb(null, results.name);
  });
};

//-----------------------------------------------------------------------------
/**
 * Displays a prompt for choosing a servo.
 * @param {Object} project The project object.
 * @param {String} [servoId] Default selection.
 * @param {Function} cb
 */
//-----------------------------------------------------------------------------
project.chooseServoPrompt = function(project, servoId, cb) {

  if(project.pus.length === 0) {
    return cb(null, null);
  }

  if(project.pus.length === 1) {
    return cb(null, project.pus[0])
  }

  modulus.io.print('Please choose which servo to use:'.input);

  for(var i = 0, len = project.pus.length; i < len; i++) {
    var pu = project.pus[i];
    var index = i + 1;

    modulus.io.print('  '  + index.toString().input + ') '.input + 'Servo: ' + pu.id + ', Status: ' + pu.status);
  }

  modulus.io.prompt.get([{
    name : 'servo',
    description : 'Servo Number?',
    warning : 'Servo number has to be between 1 and ' + project.pus.length,
    minimum : 1,
    maximum : project.pus.length,
    type : 'number',
    required : true
  }], function(err, answer) {
    if(err) {
      return error.handlePromptError(err, cb);
    }
    cb(null, project.pus[answer.servo - 1]);
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
project.chooseProjectPrompt = function(projects, projectName, cb) {
  var projectIndex = -1,
      metaPath = null,
      foundPrint = 'Selecting %s\n';

  if(typeof projectName === 'function') {
    cb = projectName;
    projectName = null;
  }

  // Check for "mod-project-name" and set `projectName` to the result.
  metaPath = findFileSync(project.dir || process.cwd(), 'package.json', ['.git', 'node_modules']);
  if (metaPath && autoCmds.indexOf(project.cmd) >= 0) {
    var meta = JSON.parse(fs.readFileSync(metaPath), 'utf8');

    if (typeof meta['mod-project-name'] !== 'undefined') {
      // "mod-project-name" found in package, check for the project name
      // in the list of projects to make sure it exists.
      projectIndex = projectInArray(projects, meta['mod-project-name']);

      if (projectIndex >= 0) {
        modulus.io.print('Found mod-project-name \'' + meta['mod-project-name'] + '\' in package.json');
        projectName = projects[projectIndex].name;
        modulus.io.print(util.format(foundPrint, projectName.data));
      }
    }
  }

  // A default selection has been made. See if a match exists in the collection.
  // prevents crashes when -p is flagged but no name is given
  if(typeof projectName === 'string') {
    projectIndex = projectInArray(projects, projectName);
    if (projectIndex >= 0) return cb(null, projects[projectIndex]);

    // No match was found. Error out.
    return cb({ code: 'NO_MATCHING_NAME' });
  }

  if(projects.length === 1) {
    var selectedProject = projects[0];
    modulus.io.prompt.get([{
      name : 'confirm',
      description : 'Are you sure you want to use project ' + selectedProject.name.data + '?',
      message : 'Acceptable response is "yes" or "no".',
      pattern : /^[yntf]{1}/i,
      default : 'yes'
    }], function(err, result) {
      if(err) {
        return error.handlePromptError(err, cb);
      }
      var y = /^[yt]{1}/i.test(result.confirm);
      var p = y ? selectedProject : null;
      return cb(null, p);
    });
  } else {
    modulus.io.print('Please choose which project to use:'.input);
    for(var i = 0, len = projects.length; i < len; i++) {
      var index = i + 1;
      modulus.io.print('  '  + index.toString().input + ') '.input + projects[i].name.input);
    }
    modulus.io.prompt.get([{
      name : 'project',
      description : 'Project Number?',
      warning : 'Project number has to be between 1 and ' + projects.length,
      required : true,
      type : 'number',
      minimum : 1,
      maximum : projects.length
    }], function(err, result) {
      if(err) {
        return error.handlePromptError(err, cb);
      }
      modulus.io.print(util.format(foundPrint, projects[result.project - 1].name.data));
      return cb(null, projects[result.project - 1]);
    });
  }
};

module.exports = project;
