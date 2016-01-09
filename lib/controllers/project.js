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
    util = require('util'),
    os = require('os'),
    librarian = require('../common/api').librarian,
    userConfig = require('../common/api').userConfig,
    fs = require('fs'),
    fsTools = require('fs-tools'),
    path = require('path'),
    ProgressBar = require('progress'),
    Progress = require('../util/progress'),
    Errors = require('../util/errors'),
    Uploader = require('./uploader'),
    http = require('http'),
    https = require('https'),
    async = require('async'),
    uuid = require('node-uuid'),
    Ignore = require('fstream-ignore'),
    demeteorizer = require('demeteorizer');

var packer = require('zip-stream');
var through = require('through');
var split = require('split');

http.globalAgent.maxSockets = Number.MAX_VALUE;
https.globalAgent.maxSockets = Number.MAX_VALUE;

//-----------------------------------------------------------------------------
var Project = function() {

};

//-----------------------------------------------------------------------------
Project.prototype.create = function(name, creatorId, servoSize, imageTagIds, callback) {
  var proj = { name: name, creator: creatorId };
  servoSize = parseInt(servoSize, 10);

  if (!isNaN(servoSize)) {
    proj.servoSize = servoSize;
  }

  if ('object' === typeof imageTagIds) {
    proj.imageTagIds = imageTagIds;
  }

  librarian.project.create(proj, false, userConfig.data.apiKey, callback);
};

//-----------------------------------------------------------------------------
Project.prototype.delete = function(projectId, callback) {
  librarian.project.delete(projectId, userConfig.data.apiKey, function(err, result) {
    if (err) {
      return callback(err, null);
    }

    var dbar = new Progress.indeterminate('Deleting [:bar]');
    modulus.io.startIndeterminate(dbar);


    var checkResult = function() {
      // Result key should return 'SUCCESS' as the value on successful deletion.
      if (result.result) {
        modulus.io.stopIndeterminate(dbar);
        modulus.io.print(' ');
        return callback(null, result);
      } else {
        setTimeout(checkResult, 1000);
      }
    };

    setTimeout(checkResult, 1000);
  });
};

//-----------------------------------------------------------------------------
Project.prototype.status = function(projectId, callback) {
  librarian.project.getStatus(projectId, userConfig.data.apiKey, function(err, status) {
    if (err) {
      return callback(err, null);
    }

    callback(null, status.status);
  });
};

//-----------------------------------------------------------------------------
Project.prototype.restart = function(projectId, callback) {
  librarian.project.restart(projectId, userConfig.data.apiKey, function(err) {

    if (err) {
      return callback(Errors.getMessage(err));
    }

    var dbar = new Progress.indeterminate('Restarting [:bar]');
    modulus.io.startIndeterminate(dbar);

    var checkStatus = function() {
      librarian.project.find({projectId : projectId}, userConfig.data.apiKey, function(err, proj) {

        if (err) {
          return callback(Errors.getMessage(err));
        }

        if (proj.status.toLowerCase() === Project.status.running) {
          modulus.io.stopIndeterminate(dbar);
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
  librarian.project.stop(projectId, userConfig.data.apiKey, function(err) {
    if (err) {
      return callback(Errors.getMessage(err));
    }

    var dbar = new Progress.indeterminate('Stopping [:bar]');
    modulus.io.startIndeterminate(dbar);

    var checkStatus = function() {
      librarian.project.find({projectId : projectId}, userConfig.data.apiKey, function(err, proj) {

        if (err) {
          return callback(Errors.getMessage(err));
        }

        if (proj.status.toLowerCase() === Project.status.stopped) {
          modulus.io.stopIndeterminate(dbar);
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
  librarian.project.start(projectId, userConfig.data.apiKey, function(err) {
    if (err) {
      return callback(Errors.getMessage(err));
    }

    var dbar = new Progress.indeterminate('Starting [:bar]');
    modulus.io.startIndeterminate(dbar);

    var checkStatus = function() {
      librarian.project.find({projectId : projectId}, userConfig.data.apiKey, function(err, proj) {

        if (err) {
          return callback(Errors.getMessage(err));
        }

        switch(proj.status.toLowerCase()) {
          case Project.status.running:
            modulus.io.stopIndeterminate(dbar);
            modulus.io.print(' ');
            return callback(null, proj);
          case Project.status.stopped:
            modulus.io.print(' ');
            return callback('There was a problem starting your project.');
          default:
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
Project.prototype.deploy = function(projectId, dir, includeModules, registry, meteorDebug, withTests, callback) {
  var projectController = this;
  var projectType;

  async.waterfall([
      function(cb) {
        projectController.detectProjectType(dir, cb);
      },

      function(type, cb) {
        projectType = type;

        switch(type) {
          case Project.types.NODEJS:
            cb(null, dir);
            break;
          case Project.types.METEOR:
            modulus.io.print('Meteor project detected...');

            projectController.demeteorize(dir, meteorDebug, function(err, out) {
              if (err) {
                modulus.io.print(err);
                return cb(err);
              }

              cb(null, out);
            });
            break;
        }
      },

      function (out, cb) {
        var compressTarget = projectType === Project.types.METEOR
          ? path.join(out, 'bundle') : out;

        modulus.io.print('Compressing project...');
        projectController.packageProject(
          compressTarget,
          includeModules,
          function (err, zipFile) {
            if (err) {
              // The zip bundle may have been partially created. Remove it.
              if (zipFile && fs.existsSync(zipFile)) {
                fs.unlinkSync(zipFile);
              }

              return cb('Error compressing project: ' + err);
            }

            cb(null, out, zipFile);
          });
      },

      function(path, zipFile, cb) {
        projectController._deploy(projectId, zipFile, registry, withTests, function(err, domain) {
          fs.unlinkSync(zipFile);

          //Removes the .demeteorized folder
          if (projectType === Project.types.METEOR) {
            fsTools.removeSync(path);
          }

          if (err) {
            console.log(); //provides a newline
            return cb(err, null);
          }

          cb(null, domain);
        });
      }
    ],
    function(err, domain) {
      if (!err) {
        callback(null, domain);
      } else {
        callback(err);
      }
    }
  );
};

//-----------------------------------------------------------------------------
Project.prototype._deploy = function(projectId, file, registry, withTests, callback) {
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

  var client = new Uploader(),
    options = {
      registry: registry,
      withTests: !!withTests
    };

  client.upload(projectId, file, options);

  client.on('progress', function(progress) {

    // The progress bar UI starts at 1. This keeps it from jumping
    // to zero, then back to 1.
    if (progress < 0.01) {
      progress = 0.01;
    }

    if (process.stdout.isTTY) { ubar.tick((progress * 100) - ubar.curr); }
  });

  client.on('error', function(err) {
    //closes the ubar readline interface
    ubar.rl.close();

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
        if (err) {
          return callback(Errors.getMessage(err));
        }

        if (!proj || !proj.status) {
          return callback('There was a problem deploying your project.');
        }

        var runtime = proj.images ? proj.images.run.label : 'Node.js';

        if (proj.status.toLowerCase() !== status) {
          var newStatus = proj.status.toLowerCase();

          switch(newStatus) {
            case Project.status.deploying:
              status = newStatus;
              modulus.io.print(util.format('\nDeploying project into %s runtime...', runtime));
              break;
            case Project.status.running:
              if (status !== Project.status.uploading) {
                getDeployLogs(function() {
                  modulus.io.print(' ');
                  callback(null, proj.domain);
                });
                return;
              }
              break;
            default:
              return callback('There was a problem deploying your project.');
          }
        }
        if (status !== Project.status.running) {
          setTimeout(projectStatus, 1000);
        }
      });
    };
    projectStatus();

    var deployLogs = function() {
      if (status === Project.status.deploying) {
        getDeployLogs(function(){});
      }

      if (status !== Project.status.running) {
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

  var endpoint = util.format('/project/%s/logs/download?authToken=%s',
    projectId, userConfig.data.apiKey);

  librarian._http.raw(endpoint, 'GET', null, function(err, req, res) {
    if (err){
      callback(Errors.getMessage(err));
    }
    if (res.statusCode === 404){
      callback('Problem downloading logs: ' + res.statusCode);
    }

    var date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    var outFile = projectName + '_' + date + '.tar.gz';

    if (typeof outLocation === 'string') {
      outFile = outLocation;
      outFile = outFile.replace(/\//g, '/');
      if (!fs.existsSync(path.dirname(outLocation))){
        return callback('Directory ' + path.dirname(outLocation) + ' does not exist.');
      }
    }
    var dir = '';
    if (path.dirname(outLocation) === '.'){
      dir = process.cwd();
    } else {
      dir = path.dirname(path.resolve(outLocation));
    }
    outFile = outFile.replace(/ /g, '_').replace(/:/g,'.').replace(/[[\]{}@~`<>()*+=%&!?,\\^$|#\s]/g,'');

    var result = {};
    var stream = fs.createWriteStream(outFile);

    res.pipe(stream);
    res.on('end', function(err, stdout, stderr){
      if (err){
        callback(Errors.getMessage(err));
      }
      if (stderr){
        result.stderr = stderr;
      }
      if (stdout){
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
  librarian.project.clearLogs(projectId, userConfig.data.apiKey, function(err, res){
    if (err){
      callback(Errors.getMessage(err));
    }
    if (res.statusCode === 404){
      callback('Problem clearing logs: ' + res.statusCode);
    }
    callback(null, res);
  });
};

/**
 * Streams log for the specified project.
 * @param {String} projectId The project ID.
 * @param {function} callback.
 */
//-----------------------------------------------------------------------------
Project.prototype.streamLogs = function(projectId, servos, callback){
  // TODO: add param for prefix?
  modulus.io.success('Log streaming started (ctrl-c to exit)...');
  if ( ! Array.isArray(servos)) {
    servos = [servos];
  }

  servos.forEach(function (servo){
    var endpoint = util.format('%s://%s:%s/project/%s/logs/stream?authToken=%s&servoId=%s',
      librarian._http._ssl ? 'https' : 'http',
      librarian._http._host,
      librarian._http._port,
      projectId,
      userConfig.data.apiKey,
      servo.id);

    var h = librarian._http._ssl ? https : http;
    var disconnected = false;

    var done = function () {
      if ( ! disconnected) {
        callback();
        disconnected = true;
      }
    };

    var tr = through(function (line) {
      var prefix = servo.id.substr(0, 8);
      line = util.format('%s> %s\n', prefix, line);
      this.queue(line);
    });

    var req = h.get(endpoint, function (res) {
      if (servos.length > 1) {
        res.pipe(split()).pipe(tr).pipe(process.stdout);
      } else {
        res.pipe(process.stdout);
      }
      res.on('error', function () { done(); });
      res.on('close', function () { done(); });
      res.on('end', function () { done(); });
    });

    req.on('error', function () { done(); });
  });
};

//-----------------------------------------------------------------------------
Project.prototype.scale = function (projectId, instances, await, callback) {
  librarian.project.scale(projectId, instances, userConfig.data.apiKey, function (err) {
    var dbar;

    if (err) {
      return callback(Errors.getMessage(err));
    }

    var checkStatus = function () {
      librarian.project.find(
        { projectId: projectId },
        userConfig.data.apiKey,
        function (err, proj) {
          if (err) {
            return callback(Errors.getMessage(err));
          }

          if (proj.status.toLowerCase() === Project.status.running) {
            modulus.io.stopIndeterminate(dbar);
            modulus.io.print(' ');
            return callback(null, proj);
          } else {
            setTimeout(checkStatus, 1000);
          }
        });
    };

    if (await) {
      dbar = new Progress.indeterminate('Scaling [:bar]');
      modulus.io.startIndeterminate(dbar);
      setTimeout(checkStatus, 1000);
    } else {
      callback();
    }
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
    if (err) {
      return callback(err);
    }

    if (result) {
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
      if (files.indexOf('.meteor') !== -1) {
        fs.readdir(path.join(dir, '.meteor'), callback);
      }
      else {
        callback('ok', false);
      }
    },
    // Look for packages
    function(files, callback) {
      if (files.indexOf('packages') !== -1) {
        callback(null, true);
      }
      else {
        callback(null, false);
      }
    }
  ],
  function(err, result) {
    if (err === 'ok') {
      err = null;
    }

    callback(err, result);
  });
};

//-----------------------------------------------------------------------------
/**
 * Demeteorizes the project.
 * @param {string} dir The path being demeteorized.
 * @param {boolean} meteorDebug Value indicated whether to override debug mode.
 * @param {function} callback Invoked with (err, demeteorizedPath)
 */
//-----------------------------------------------------------------------------
Project.prototype.demeteorize = function(dir, meteorDebug, callback) {
  var out = path.join(dir, '.demeteorized');

  if (fs.existsSync(out)) {
    fsTools.removeSync(out);
  }

  demeteorizer({
    input: dir,
    debug: meteorDebug,
    directory: out,
    architecture: 'os.linux.x86_64'
  },
  function(err) {
    callback(err, out);
  });
};

//-----------------------------------------------------------------------------
/**
 * Archives a project's files.
 * @param {string} dir The path to archive.
 * @param {boolean} includeModules Flag to include the node_modules folder.
 * @param {function} callback Invoked with (err, archiveFile)
 *
 */
//-----------------------------------------------------------------------------
Project.prototype.packageProject = function(dir, includeModules, cb) {

  var fname = os.tmpDir() + '/' + 'modulus-auto-zip-' + uuid.v4() + '.zip';
  var out = fs.createWriteStream(fname);
  var zip = new packer();

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
  if (!includeModules) {
    fs.appendFileSync(path.join(dir, '.modulus-base-ignore'), '\nnode_modules');
  }

  var zipAdders = [];

  ignore.on('child', function (c) {
    if (c.type === 'File' || c.type === 'SymbolicLink') {

      // Incoming file could be symlink, need to check if it points to something
      // and it points to a file.
      if (fs.existsSync(c.path) && fs.statSync(c.path).isFile()) {

        // Replace Windows EOL with Unix EOL so that paths are cleaned up
        // correctly.
        var filePath = c.path.replace(/\\/g, '/');

        zipAdders.push(function (done) {
          zip.entry(fs.createReadStream(c.path), {
            name: filePath.replace(dir, ''),
            mode: fs.statSync(c.path).mode
          }, done);
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
    async.series(zipAdders, function (err) {
      if (err) return cb(err);
      zip.finish();
    });
  });

  out.on('close', function() {
    var stats = fs.statSync(fname);
    modulus.io.print(makeBytesReadable(stats.size.toString()).data + ' written');

    // Remove the base ignore file.
    fs.unlinkSync(path.join(dir, '.modulus-base-ignore'));

    if (!error) {
      return cb(null, fname);
    }
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
};

module.exports = new Project();
