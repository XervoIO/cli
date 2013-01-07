var modulus = require('../modulus'),
    projectController = require('../controllers/project'),
    userController = require('../controllers/user'),
    async = require('async'),
    userConfig = require('../common/api').userConfig,
    error = require('../common/error'),
    zipstream = require('zipstream'),
    walkFiles = require('walkr'),
    uuid = require('node-uuid'),
    fs = require('fs'),
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

project.deploy = function(dir, cb) {
  if(typeof dir !== 'string') {
    dir = process.cwd();
  }

  dir = dir.replace(/\\/g, '/');

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
      project.chooseProjectPrompt(projects, function(err, result) {
        if(err) {
          err = error.handleApiError(err, 'DEPLOY_PROJECT', cb);
          if(err.length > 0) {
            return cb(err);
          }
        }
        if(!result) {
          return cb('You must deploy to a project.');
        }
        // Check for package.json and app.js
        // Check if package.json is correctly formatted
        // Zip of files, when zipping exclude .DS_Store, __MACOSX
        // Send zip file stream to server
        modulus.io.print('Compressing project...');
        project._packageProject(dir, function(err, fname) {
          if(err) {
            return cb('Error compressing project.');
          }
          var fpath = process.cwd() + '/' + fname;
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

/**
 * Gets the logs for a specific project. This command will display the list of
 * projects for the user to select.
 * @param {function} cb Callback invoked with log data.
 */
//-----------------------------------------------------------------------------
project.getLogs = function(cb) {
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
      project.chooseProjectPrompt(projects, function(err, result) {
        if(err) {
          err = error.handleApiError(err, 'GET_PROJECT_LOGS', cb);
          if(err.length > 0) {
            return cb(err);
          }
        }
        if(!result) {
          return cb('You must select a project.');
        }

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
      });
  });
};

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

project.chooseProjectPrompt = function(projects, cb) {
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

project._packageProject = function(dir, cb) {
  var fname = 'modulus-auto-zip-' + uuid.v4() + '.zip';
  var out = fs.createWriteStream(fname);
  var zip = zipstream.createZip({ level: 1 });

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

  // TODO : better exclude mechinism
  walkFiles(dir).
  filter(/^\.git/).
  filterDir(/node_modules/).
  filterDir(/__MACOSX/).
  filterFile(function(ops, next) {
    if(ops.name.indexOf('modulus-auto-zip-') === 0) {
      return next();
    }

    var pathRegex = new RegExp('^' + dir + '/');
    var rel = ops.source.replace(pathRegex, '');

    zip.addFile(fs.createReadStream(ops.source), {name: rel}, function() {
      next();
    });
  }).
  start(function(err) {
    zip.finalize(function(written) {
      var bytes = written + '';
      modulus.io.print(makeBytesReadable(bytes).data + ' written');
      return cb(null, fname);
    });
  });
};

module.exports = project;