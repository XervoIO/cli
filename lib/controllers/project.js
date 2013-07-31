var modulus = require('../modulus'),
    librarian = require('../common/api').librarian,
    userConfig = require('../common/api').userConfig,
    fs = require('fs'),
    path = require('path'),
    ProgressBar = require('progress'),
    Progress = require('../util/progress'),
    Errors = require('../util/errors'),
    request = require('request'),
    http = require('http'),
    uploader = require('chunk-loader').Client,
    https = require('https'),
    async = require('async');

http.globalAgent.maxSockets = Number.MAX_VALUE;
https.globalAgent.maxSockets = Number.MAX_VALUE;

//-----------------------------------------------------------------------------
var Project = function() {

};

//-----------------------------------------------------------------------------
Project.prototype.create = function(name, creatorId, callback) {
  librarian.project.create({
    name: name,
    creator: creatorId
  }, false, userConfig.data.apiKey, callback);
};

//-----------------------------------------------------------------------------
Project.prototype.restart = function(projectId, callback) {
  librarian.project.restart(projectId, userConfig.data.apiKey, function(err, result) {
    if(err) {
      return callback(Errors.getMessage(err));
    }

    var dbar = new Progress.indeterminate('Restarting [:bar]');
    dbar.start();

    var checkStatus = function() {
      librarian.project.find({projectId : projectId}, userConfig.data.apiKey, function(err, proj) {

        if(err) {
          return callback(Errors.getMessage(err));
        }

        if(proj.status.toLowerCase() === Project.status.running) {
          dbar.stop();
          modulus.io.print(' ');
          return callback(null, proj);
        }
        else {
          setTimeout(checkStatus, 1000);
        }
      });
    };

    setTimeout(checkStatus, 1000);
  });
};

//-----------------------------------------------------------------------------
Project.prototype.stop = function(projectId, callback) {
  librarian.project.stop(projectId, userConfig.data.apiKey, function(err, result) {
    if(err) {
      return callback(Errors.getMessage(err));
    }

    var dbar = new Progress.indeterminate('Stopping [:bar]');
    dbar.start();

    var checkStatus = function() {
      librarian.project.find({projectId : projectId}, userConfig.data.apiKey, function(err, proj) {

        if(err) {
          return callback(Errors.getMessage(err));
        }

        if(proj.status.toLowerCase() === Project.status.stopped) {
          dbar.stop();
          modulus.io.print(' ');
          return callback(null, proj);
        }
        else {
          setTimeout(checkStatus, 1000);
        }
      });
    };

    setTimeout(checkStatus, 1000);
  });
};

//-----------------------------------------------------------------------------
Project.prototype.start = function(projectId, callback) {
  librarian.project.start(projectId, userConfig.data.apiKey, function(err, result) {
    if(err) {
      return callback(Errors.getMessage(err));
    }

    var dbar = new Progress.indeterminate('Starting [:bar]');
    dbar.start();

    var checkStatus = function() {
      librarian.project.find({projectId : projectId}, userConfig.data.apiKey, function(err, proj) {

        if(err) {
          return callback(Errors.getMessage(err));
        }

        if(proj.status.toLowerCase() === Project.status.running) {
          dbar.stop();
          modulus.io.print(' ');
          return callback(null, proj);
        }
        else {
          setTimeout(checkStatus, 1000);
        }
      });
    };

    setTimeout(checkStatus, 1000);
  });
};

//-----------------------------------------------------------------------------
Project.prototype.find = function(opts, callback) {
  librarian.project.find(opts, userConfig.data.apiKey, callback);
};

//-----------------------------------------------------------------------------
Project.prototype.saveVars = function(projectId, vars, callback) {
  librarian.project.saveVars(projectId, vars, userConfig.data.apiKey, callback);
};

//-----------------------------------------------------------------------------
Project.prototype.deploy = function(projectId, file, callback) {
  var host = librarian._http._host;
  var port = librarian._http._port;
  var protocol = librarian._http._ssl ? 'https' : 'http';

  modulus.io.print('Uploading project...');
  var status = Project.status.uploading;

  // start checking for status changes
  // show progress for upload and inderminate progress for deploying
  var ubar = new ProgressBar('Upload progress [:bar] :percent', {
    complete: '=',
    incomplete: ' ',
    width: 20,
    total: 100
  });
  if (process.stdout.isTTY) { ubar.tick(); }

  var client = uploader.uploadFile(file,
    {
      beginProtocol: 'http',
      uploadProtocol: 'http',
      beginPort: '8888',
      uploadPort: '8888',
      host: host,
      port: port,
      debug: false,
      encrypted: true,
      tag: { projectId: projectId, authToken: userConfig.data.apiKey }
    }
  );

  client.on('progress', function(p) {
    if (process.stdout.isTTY) { ubar.tick(((p.sent / p.total) * 100) - ubar.curr); }
  });

  client.on('error', function(err) {
    callback(err);
  });

  client.on('complete', function() {
    //var dbar = new Progress.indeterminate('Deploying [:bar]');

    // check every second for project status change
    var projectStatus = function () {
      librarian.project.find({projectId : projectId}, userConfig.data.apiKey, function(err, proj) {
        if(!err) {
          if(proj && proj.status) {
            if(proj.status.toLowerCase() !== status) {
              var newStatus = proj.status.toLowerCase();
              if(newStatus === Project.status.deploying) {
                status = newStatus;
                modulus.io.print('\nDeploying Project...');
                //dbar.start();
              } else if(newStatus === Project.status.running && status !== Project.status.uploading) {
                //dbar.stop();
                modulus.io.print(' ');
                return callback(null, proj.domain);
              }
            }
          }
        }

        if(status !== Project.status.running) {
          setTimeout(projectStatus, 1000);
        }
      });
    };
    projectStatus();

    var logLength = 0;
    var deployLogs = function() {
      if(status === Project.status.deploying) {
        librarian.project.getDeployLogs(projectId, userConfig.data.apiKey, function(err, result) {
          for(var key in result) {
            var log = result[key];
            modulus.io.write(log.substring(logLength));
            logLength = log.length;
            break;
          }
        });
      }

      if(status !== Project.status.running) {
        setTimeout(deployLogs, 1000);
      }
    };
    deployLogs();
  });
};

/**
 * Gets the logs for the specified project id.
 * @param {string} projectId The ID of the project.
 * @param {function} callback Function invoked with log results.
 */
//-----------------------------------------------------------------------------
Project.prototype.getLogs = function(projectId, callback) {
  librarian.project.getLog(projectId, userConfig.data.apiKey, callback);
};

//-----------------------------------------------------------------------------
Project.prototype.scale = function(projectId, instances, callback) {
  librarian.project.scale(projectId, {instances:instances}, userConfig.data.apiKey, function(err, result) {
    if(err) {
      return callback(Errors.getMessage(err));
    }

    var dbar = new Progress.indeterminate('Scaling [:bar]');
    dbar.start();

    var checkStatus = function() {
      librarian.project.find({projectId : projectId}, userConfig.data.apiKey, function(err, proj) {

        if(err) {
          return callback(Errors.getMessage(err));
        }

        if(proj.status.toLowerCase() === Project.status.running) {
          dbar.stop();
          modulus.io.print(' ');
          return callback(null, proj);
        }
        else {
          setTimeout(checkStatus, 1000);
        }
      });
    };

    setTimeout(checkStatus, 1000);
  });
};
//-----------------------------------------------------------------------------
/**
 * Detects the type of project being deployed.
 * @param {string} path The path being deployed.
 * @param {function} callback
 */
//-----------------------------------------------------------------------------
Project.prototype.detectProjectType = function(path, callback) {
  this.isMeteor(path, function(err, result) {
    if(err) {
      return callback(err);
    }

    if(result) {
      callback(null, Project.types.METEOR);
    }
    else {
      callback(null, Project.types.NODEJS);
    }
  });
};

//-----------------------------------------------------------------------------
/**
 * Detects whether or not the project being deployed is a Meteor application.
 * Looks for a .meteor folder that contains a packages file.
 * @param {string} dir The path being deployed.
 * @param {function} callback Invoked with (err, true|false)
 */
//-----------------------------------------------------------------------------
Project.prototype.isMeteor = function(dir, callback) {

  async.waterfall([
    function(callback) {
      fs.readdir(dir, callback);
    },
    // Look for .meteor
    function(files, callback) {
      if(files.indexOf('.meteor') !== -1) {
        fs.readdir(path.join(dir, '.meteor'), callback);
      }
      else {
        callback('ok', false);
      }
    },
    // Look for packages
    function(files, callback) {
      if(files.indexOf('packages') !== -1) {
        callback(null, true);
      }
      else {
        callback(null, false);
      }
    }
  ], 
  function(err, result) {
    if(err === 'ok') {
      err = null;
    }

    callback(err, result);
  });
};

//-----------------------------------------------------------------------------
/**
 * Various project statuses.
 */
//-----------------------------------------------------------------------------
Project.status = {
  uploading : 'uploading',
  deploying : 'deploying',
  running : 'running',
  stopped: 'stopped'
};

//-----------------------------------------------------------------------------
/**
 * The types of projects that can be deployed.
 */
//-----------------------------------------------------------------------------
Project.types = {
  NODEJS : 'NODEJS',
  METEOR : 'METEOR'
}

module.exports = new Project();