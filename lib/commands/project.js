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
    util = require('util');

var project = {}, autoCmds = ['start', 'deploy', 'env set'];

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

project.create = function(cb) {
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

      project._createProjectPrompt(function(err, name) {
        if(err) {
          return cb('Could not create project.');
        }
        projectController.create(
          name,
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
            modulus.io.success('New project ' + name.data + ' created.');
            return cb();
        });
      });
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
 * @param {function} cb The callback.
 */
//-----------------------------------------------------------------------------
project.deploy = function(projectName, dir, projectType, includeModules, nodeVersion, cb) {

  if(typeof dir !== 'string') {
    dir = process.cwd();
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
          console.log(cb);
          err = error.handleApiError(err, 'DEPLOY_PROJECT', cb);
          if(err.length > 0) {
            return cb(err);
          }
        }

        if(!result) {
          return cb('You must deploy to a project.');
        }

        projectController.deploy(result.id, dir, projectType, includeModules, nodeVersion, function(err, domain) {
          if(!err) {
            modulus.io.success(result.name + ' running at ' + domain);
            cb();
          } else {
            err = error.handleApiError(err, 'DEPLOY_PROJECT', cb);
            cb(err);
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
          projectController.getLogs(result.id, function(err, result) {
            if(err) return cb(err);
              if(result.length > 0) {
                modulus.io.print('Please choose which servo to show logs for:'.input);
                for(var i = 0, len = result.length; i < len; i++) {
                  var index = i + 1;
                  modulus.io.print('  '  + index.toString().input + ') '.input + 'Host ID : ' + result[i].servo.hostId + ', IP : ' + result[i].servo.ip + ', Status : ' + result[i].servo.status );
                }
                modulus.io.prompt.get([{
                  name : 'servo',
                  description : 'Servo Number?',
                  warning : 'Servo number has to be between 1 and ' + result.length,
                  minimum : 1,
                  maximum : result.length,
                  type : 'number',
                  required : true
                }], function(err, answer) {
                  if(err) {
                    return error.handlePromptError(err, cb);
                  }
                  modulus.io.print(result[answer.servo - 1].log);
                  modulus.io.success('Logs successfully retrieved for servo ' + answer.servo);
                  cb();
                });
              }
              else {
                modulus.io.print('No log data.');
                cb();
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
        projectController.streamLogs(result.id, function() {
          modulus.io.error('Disconnected from stream.');
        });
      });
    }
  );
};

//--------------------------------------------------------------------
project.scale = function(instances, cb) {

  var instances = parseInt(instances);

  if(isNaN(instances)) {
    modulus.io.error('Number of Servos is missing.')
    modulus.help.printUsage('scale');
    return cb();
  }

  if(instances < 1) {
    modulus.io.error('The number of Servos must be greater than 0.')
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
            modulus.io.success('Project successfully scaled to ' + instances + ' servos');
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