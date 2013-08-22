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
    Uploader = require('./uploader'),
    https = require('https');

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
  // show progress for upload and indeterminate progress for deploying
  var ubar = new ProgressBar('Upload progress [:bar] :percent', {
    complete: '=',
    incomplete: ' ',
    width: 20,
    total: 100
  });
  if (process.stdout.isTTY) { ubar.tick(); }

  var client = new Uploader();
  client.upload(projectId, file);

  client.on('progress', function(progress) {

    // The progress bar UI starts at 1. This keeps it from jumping
    // to zero, then back to 1.
    if(progress < 0.01) {
      progress = 0.01;
    }

    if (process.stdout.isTTY) { ubar.tick((progress * 100) - ubar.curr); }
  });

  client.on('error', function(err) {
    callback(err);
  });

  client.on('end', function() {

    var logLength = 0;
    var getDeployLogs = function(cb) {
      librarian.project.getDeployLogs(projectId, userConfig.data.apiKey, function(err, result) {
        for(var key in result) {
          var log = result[key];
          modulus.io.write(log.substring(logLength));
          logLength = log.length;
          break;
        }

        cb();
      });
    };

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
              } else if(newStatus === Project.status.running && status !== Project.status.uploading) {
                getDeployLogs(function() {
                  modulus.io.print(' ');
                  callback(null, proj.domain);
                });
                return;
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

    var deployLogs = function() {
      if(status === Project.status.deploying) {
        getDeployLogs(function(){});
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

/**
 * Downloads the logs as a tarball for the specified project id.
 * @param {string} projectId - the ID of the project.
 * @param {string} projectName - the name of the project
 * @param {string} outLocation - the path to the directory where the tarball should be downloaded
 * @param {function} callback - function invoked with the file stream. Responsible for the actual download.
 */
//-----------------------------------------------------------------------------
Project.prototype.downloadLogs = function(projectId, projectName, outLocation, callback) {
  librarian.project.downloadLogs(projectId, userConfig.data.apiKey, function(err, req, res){
    if(err){
      callback(Errors.getMessage(err));
    }
    if(res.statusCode == 404){
      callback("Problem downloading logs: " + res.statusCode);
    }

    var date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    var outFile = projectName + '_' + date + '.tar.gz';

    if(outLocation!=null && typeof outLocation == 'string'){
      outFile = outLocation;
      outFile = outFile.replace(/\//g, '/');
      if(!fs.existsSync(path.dirname(outLocation))){
        return callback('Directory ' + path.dirname(outLocation) + ' does not exist.');
      };
    }
    var dir = '';
    if(path.dirname(outLocation) == '.'){
      dir = process.cwd();
    } else {
      dir = path.dirname(path.resolve(outLocation));
    }
    outFile = outFile.replace(/ /g, '_').replace(/:/g,'.').replace(/[[\]{}@~`<>()*+=%&!?,\\^$|#\s]/g,'');

    var result = {};
    var stream = fs.createWriteStream(outFile);

    res.pipe(stream);
    res.on('end', function(err, stdout, stderr){
      if(err){
        callback(Errors.getMessage(err));
      }
      if(stderr){
        result.stderr = stderr;
      }
      if(stdout){
        result.stdout = stdout;
      }
      result.msg = path.basename(outFile) + ' downloaded to ' + dir + '.';
      result.outFile = outFile;
      callback(null, result);
    });
  });
};

/**
 * Wipes all project logs for a given project
 * @param {integer} projectId - project id
 * @param {function} callback - callback function
*/
//-----------------------------------------------------------------------------
Project.prototype.clearLogs = function(projectId, callback){
  librarian.project.clearLogs(projectId, userConfig.data.apiKey, callback);
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
Project.status = {
  uploading : 'uploading',
  deploying : 'deploying',
  running : 'running',
  stopped: 'stopped'
};

module.exports = new Project();