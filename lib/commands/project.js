var modulus = require('../modulus'),
    projectController = require('../controllers/project'),
    userController = require('../controllers/user'),
    async = require('async'),
    userConfig = require('../common/api').userConfig,
    error = require('../common/error'),
    archiver = require('archiver'),
    walkFiles = require('walkr'),
    uuid = require('node-uuid'),
    fs = require('fs'),
    Ignore = require('fstream-ignore'),
    path = require('path');

var project = {};

project.stop = function(cb) {
  project.stopStartRestart('stop', cb);
};

project.start = function(cb) {
  project.stopStartRestart('start', cb);
};

project.restart = function(cb) {
  project.stopStartRestart('restart', cb);
};

project.stopStartRestart = function(action, cb) {
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
      project.chooseProjectPrompt(projects, function(err, result) {
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
 * @param {boolean} includeModules Whether or not to include node_modules directory in upload.
 * @param {function} cb The callback.
 */
//-----------------------------------------------------------------------------
project.deploy = function(projectName, dir, includeModules, cb) {

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

        modulus.io.print('Compressing project...');
        project._packageProject(dir, includeModules, function(err, fname) {

          var fpath = process.cwd() + '/' + fname;

          if(err) {

            // The zip bundle may have been partially created. Remove it.
            if(fname && fs.existsSync(fpath)) {
              fs.unlinkSync(fpath)
            }
            return cb('Error compressing project: ' + err);
          }

          projectController.deploy(result.id, fpath, function(err, domain) {
            fs.unlinkSync(fpath);
            if(!err) {
              modulus.io.success(result.name + ' running at ' + domain);
              cb();
            } else {
              err = error.handleApiError(err, 'DEPLOY_PROJECT', cb);
              if(err.length > 0) {
                return cb(err);
              }
            }
          });
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
            if(!err) {
              if(result.length > 0) {
                modulus.io.print(result[0].log);
                modulus.io.success('Logs successfully retrieved.');
              }
              else {
                modulus.io.print('No log data.');
              }
            }
            cb(err);
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
 * @param {function} cb Callback invoked with log data.
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

//--------------------------------------------------------------------
project.scale = function(instances, cb) {
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

  if(typeof projectName === 'function') {
    cb = projectName;
    projectName = null;
  }

  // A default selection has been made. See if a match exists in the collection.
  if(typeof projectName === 'string') { // prevents crashes when -p is flagged but no name is given
    for(var i = 0; i < projects.length; i++) {
      if(projects[i].name.toUpperCase() === projectName.toUpperCase()) {
        return cb(null, projects[i]);
      }
    }

    // No match was found. Error out.
    return cb({ code: 'NO_MATCHING_NAME' });
  }

  if(projects.length === 1) {
    var project = projects[0];
    modulus.io.prompt.get([{
      name : 'confirm',
      description : 'Are you sure you want to use project ' + project.name.data + '?',
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
    modulus.io.print('Please choose which project to use:'.input);
    for(var i = 0, len = projects.length; i < len; i++) {
      var index = i + 1;
      modulus.io.print('  '  + index.toString().input + ') '.input + projects[i].name.input);
    }
    modulus.io.prompt.get([{
      name : 'project',
      description : 'Project Number?',
      warning : 'Project number has to be between 1 and ' + projects.length,
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

//-------------------------------------------------------------------------------------------------
project._packageProject = function(dir, includeModules, cb) {

  var fname = 'modulus-auto-zip-' + uuid.v4() + '.zip';
  var out = fs.createWriteStream(fname);
  var zip = archiver('zip');

  var makeBytesReadable = function(bytes) {
    bytes = parseFloat(bytes);

    var precision, unit, units;
    units = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    unit = 0;
    while (bytes >= 1024) {
      unit++;
      bytes = bytes / 1024;
      precision = unit > 2 ? 2 : 1;
    }
    return '' + (bytes.toFixed(precision)) + ' ' + units[unit];
  };

  zip.pipe(out);

  var ignore = Ignore({
    path: dir,
    ignoreFiles: ['.modulus-base-ignore', '.modulusignore']
  });

  // Copy the base ignore file to the output so it can be applied.
  fs.writeFileSync(path.join(dir, '.modulus-base-ignore'),
    fs.readFileSync(path.join(__dirname, '.modulus-base-ignore')));

  // Add node_modules to ignore file if user did not want to include it.
  if(!includeModules) {
    fs.appendFileSync(path.join(dir, '.modulus-base-ignore'), '\nnode_modules');
  }

  var pathRegex = new RegExp('^' + dir + '/');

  var zipAdders = [];

  ignore.on('child', function (c) {
    if(c.type === 'File' || c.type === 'SymbolicLink') {

      // Incoming file could be symlink, need to check if it points to something
      // and it points to a file.
      if(fs.existsSync(c.path) && fs.statSync(c.path).isFile()) {

        var filePath = c.path.replace(/\\/g, '/');

        var rel = filePath.replace(pathRegex, '');

        zipAdders.push(function(callback) {
          zip.append(fs.createReadStream(c.path), { name: rel }, callback);
        });
      }
    }
  });

  var error = false;

  ignore.on('error', function(err) {
    error = true;
    fs.unlinkSync(path.join(dir, '.modulus-base-ignore'));
    cb(err, fname);
  });

  ignore.on('close', function() {
    async.series(zipAdders, function(err) {

      if(err) {
        return cb(err);
      }

      zip.finalize(function(err, written) {

        if(err) {
          return cb(err);
        }
      });
    });
  });

  out.on('close', function() {
    var stats = fs.statSync(fname);
    modulus.io.print(makeBytesReadable(stats.size.toString()).data + ' written');

    // Remove the base ignore file.
    fs.unlinkSync(path.join(dir, '.modulus-base-ignore'));

    if(!error) {
      return cb(null, fname);  
    }
  });
};

module.exports = project;