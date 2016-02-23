/* eslint-disable no-underscore-dangle, no-sync */
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

const Async = require('async');
const Demeteorizer = require('demeteorizer');
const FS = require('fs');
const FsTools = require('fs-tools');
const Https = require('https');
const Http = require('http');
const Ignore = require('fstream-ignore');
const OS = require('os');
const Packer = require('zip-stream');
const Path = require('path');
const ProgressBar = require('progress');
const Split = require('split');
const Through = require('through');
const Util = require('util');
const Uuid = require('node-uuid');

const Errors = require('../util/errors');
const Librarian = require('../common/api').librarian;
const Modulus = require('../modulus');
const Progress = require('../util/progress');
const Uploader = require('./uploader');
const UserConfig = require('../common/api').userConfig;

const BYTE_DIV = 1024;
const NOT_FOUND = 404;
const PREFIX_SUBSTRING = 8;
const PROGRESS_MIN = 0.1;
const PROGRESS_MAX = 100;
const TIMEOUT = 1000;

var Project, print = Modulus.io.print;
Http.globalAgent.maxSockets = Number.MAX_VALUE;
Https.globalAgent.maxSockets = Number.MAX_VALUE;

// ----------------------------------------------------------------------------
Project = function () {
};

// ----------------------------------------------------------------------------
Project.prototype.create = function (name, creatorId, servoSize, imageTagIds, callback) {
  var proj = { name: name, creator: creatorId };
  servoSize = parseInt(servoSize, 10);

  if (!isNaN(servoSize)) proj.servoSize = servoSize;
  if ('object' === typeof imageTagIds) proj.imageTagIds = imageTagIds;

  Librarian.project.create(proj, false, UserConfig.data.apiKey, callback);
};

// ----------------------------------------------------------------------------
Project.prototype.delete = function (projectId, callback) {
  Librarian.project.delete(
    projectId, UserConfig.data.apiKey, function (err, result) {
      var dbar, checkResult;
      if (err) return callback(err);

      dbar = new Progress.Indeterminate('Deleting [:bar]');
      Modulus.io.startIndeterminate(dbar);

      checkResult = function () {
        // Result key should return 'SUCCESS' on successful deletion.
        if (result.result) {
          Modulus.io.stopIndeterminate(dbar);
          print(' ');
          return callback(null, result);
        }
        setTimeout(checkResult, TIMEOUT);
      };

      setTimeout(checkResult, TIMEOUT);
    });
};

// ----------------------------------------------------------------------------
Project.prototype.status = function (projectId, callback) {
  Librarian.project.getStatus(
    projectId, UserConfig.data.apiKey, function (err, status) {
      if (err) return callback(err);
      callback(null, status.status);
    });
};

// ----------------------------------------------------------------------------
Project.prototype.restart = function (projectId, callback) {
  Librarian.project.restart(
    projectId, UserConfig.data.apiKey, function (err) {
      var dbar, checkStatus;
      if (err) return callback(Errors.getMessage(err));

      dbar = new Progress.Indeterminate('Restarting [:bar]');
      Modulus.io.startIndeterminate(dbar);

      checkStatus = function () {
        Librarian.project.find(
          { projectId: projectId }, UserConfig.data.apiKey, function (err, proj) {
            if (err) return callback(Errors.getMessage(err));
            if (proj.status.toLowerCase() === Project.status.running) {
              Modulus.io.stopIndeterminate(dbar);
              print(' ');
              return callback(null, proj);
            }
            setTimeout(checkStatus, TIMEOUT);
          });
      };

      setTimeout(checkStatus, TIMEOUT);
    });
};

// ----------------------------------------------------------------------------
Project.prototype.stop = function (projectId, callback) {
  Librarian.project.stop(projectId, UserConfig.data.apiKey, function (err) {
    var dbar, checkStatus;
    if (err) return callback(Errors.getMessage(err));

    dbar = new Progress.Indeterminate('Stopping [:bar]');
    Modulus.io.startIndeterminate(dbar);

    checkStatus = function () {
      Librarian.project.find(
        { projectId: projectId }, UserConfig.data.apiKey, function (err, proj) {
          if (err) return callback(Errors.getMessage(err));

          if (proj.status.toLowerCase() === Project.status.stopped) {
            Modulus.io.stopIndeterminate(dbar);
            print(' ');
            return callback(null, proj);
          }
          setTimeout(checkStatus, TIMEOUT);
        });
    };

    setTimeout(checkStatus, TIMEOUT);
  });
};

// ----------------------------------------------------------------------------
Project.prototype.start = function (projectId, callback) {
  Librarian.project.start(projectId, UserConfig.data.apiKey, function (err) {
    var dbar, checkStatus;
    if (err) return callback(Errors.getMessage(err));

    dbar = new Progress.Indeterminate('Starting [:bar]');
    Modulus.io.startIndeterminate(dbar);

    checkStatus = function () {
      Librarian.project.find(
        { projectId: projectId }, UserConfig.data.apiKey, function (err, proj) {
          if (err) return callback(Errors.getMessage(err));

          switch (proj.status.toLowerCase()) {
            case Project.status.running:
              Modulus.io.stopIndeterminate(dbar);
              print(' ');
              return callback(null, proj);
            case Project.status.stopped:
              print(' ');
              return callback('There was a problem starting your project.');
            default:
              setTimeout(checkStatus, TIMEOUT);
          }
        });
    };

    setTimeout(checkStatus, TIMEOUT);
  });
};

// ----------------------------------------------------------------------------
Project.prototype.find = function (opts, callback) {
  Librarian.project.find(opts, UserConfig.data.apiKey, callback);
};

// ----------------------------------------------------------------------------
Project.prototype.saveVars = function (projectId, vars, callback) {
  Librarian.project.saveVars(projectId, vars, UserConfig.data.apiKey, callback);
};

//-----------------------------------------------------------------------------
Project.prototype.deploy = function(projectId, dir, includeModules, registry, withTests, callback) {
  var projectType, projectController = this;

  async.waterfall([
    function (cb) {
      print('Compressing project...');
      projectController.packageProject(
        dir,
        includeModules,
        function (err, zipFile) {
          if (err) {
            // The zip bundle may have been partially created. Remove it.
            if (zipFile && fs.existsSync(zipFile)) {
              fs.unlinkSync(zipFile);
            }

            return cb('Error compressing project: ' + err);
          }

          cb(null, dir, zipFile);
        });
    },

    function (path, zipFile, cb) {
      projectController._deploy(
        projectId, zipFile, registry, withTests, function (err, domain) {
          FS.unlinkSync(zipFile);

          if (err) {
            print(' ');
            return cb(err, null);
          }

          cb(null, domain);
        });
      }
    ],
    function (err, domain) {
      if (err) return callback(err);
      return callback(null, domain);
    }
  );
};

// ----------------------------------------------------------------------------
Project.prototype._deploy = function (projectId, file, registry, withTests, callback) {
  var ubar, client, options, status = Project.status.uploading;
  print('Uploading project...');

  // start checking for status changes
  // show progress for upload and Indeterminate progress for deploying
  ubar = new ProgressBar('Upload progress [:bar] :percent', {
    complete: '=',
    incomplete: ' ',
    width: 20,
    total: 100
  });

  if (process.stdout.isTTY) ubar.tick();

  client = new Uploader();
  options = { registry: registry, withTests: Boolean(withTests) };

  client.upload(projectId, file, options);
  client.on('progress', function (progress) {
    // The progress bar UI starts at 1. This keeps it from jumping
    // to zero, then back to 1.
    if (progress < PROGRESS_MIN) progress = PROGRESS_MIN;
    if (process.stdout.isTTY) ubar.tick(progress * PROGRESS_MAX - ubar.curr);
  });

  client.on('error', function (err) {
    // closes the ubar readline interface
    ubar.rl.close();
    callback(err);
  });

  client.on('end', function () {
    var deployLogs, getDeployLogs, projectStatus, logLength = 0;
    getDeployLogs = function (cb) {
      Librarian.project.getDeployLogs(
        projectId, UserConfig.data.apiKey, function (err, result) {
          var key, log;
          for (key in result) {
            if ({}.hasOwnProperty.call(result, key)) {
              log = result[key];
              Modulus.io.write(log.substring(logLength));
              logLength = log.length;
              break;
            }
          }

          cb();
        });
    };

    // check every second for project status change
    projectStatus = function () {
      Librarian.project.find(
        { projectId: projectId }, UserConfig.data.apiKey, function (err, proj) {
          var runtime, newStatus;

          if (err) return callback(Errors.getMessage(err));
          if (!proj || !proj.status) {
            return callback('There was a problem deploying your project.');
          }

          runtime = proj.images ? proj.images.run.label : 'Node.js';

          if (proj.status.toLowerCase() !== status) {
            newStatus = proj.status.toLowerCase();

            switch (newStatus) {
              case Project.status.deploying:
                status = newStatus;
                print(Util.format(
                  '\nDeploying project into %s runtime...', runtime
                ));

                break;
              case Project.status.running:
                if (status !== Project.status.uploading) {
                  getDeployLogs(function () {
                    print(' ');
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
            setTimeout(projectStatus, TIMEOUT);
          }
        });
    };
    projectStatus();

    deployLogs = function () {
      if (status === Project.status.deploying) getDeployLogs(function () {});
      if (status !== Project.status.running) setTimeout(deployLogs, TIMEOUT);
    };

    deployLogs();
  });
};

/*
 * Gets the logs for the specified project id.
 * @param {string} projectId The ID of the project.
 * @param {function} callback Function invoked with log results.
 */
// ----------------------------------------------------------------------------
Project.prototype.getLogs = function (projectId, callback) {
  Librarian.project.getLog(projectId, UserConfig.data.apiKey, callback);
};

/*
 * Downloads the logs as a tarball for the specified project id.
 * @param {string} projectId - the ID of the project.
 * @param {string} projectName - the name of the project
 * @param {string} outLocation - the path to the directory where the tarball
 * should be downloaded
 * @param {function} callback - function invoked with the file stream.
 * Responsible for the actual download.
 */
// ----------------------------------------------------------------------------
Project.prototype.downloadLogs = function (projectId, projectName, outLocation, callback) {
  var endpoint = Util.format('/project/%s/logs/download?authToken=%s',
    projectId, UserConfig.data.apiKey);

  Librarian._http.raw(endpoint, 'GET', null, function (err, req, res) {
    var date, outFile, dir, stream, result = {};

    if (err) return callback(Errors.getMessage(err));
    if (res.statusCode === NOT_FOUND) {
      return callback('Problem downloading logs: ' + res.statusCode);
    }

    date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    outFile = projectName + '_' + date + '.tar.gz';

    if (typeof outLocation === 'string') {
      outFile = outLocation;
      outFile = outFile.replace(/\//g, '/');
      if (!FS.existsSync(Path.dirname(outLocation))) {
        return callback(
          'Directory ' + Path.dirname(outLocation) + ' does not exist.'
        );
      }
    }

    if (Path.dirname(outLocation) === '.') dir = process.cwd();
    else dir = Path.dirname(Path.resolve(outLocation));
    outFile = outFile.replace(/ /g, '_').replace(/:/g,'.')
      .replace(/[[\]{}@~`<>()*+=%&!?,\\^$|#\s]/g,'');

    stream = FS.createWriteStream(outFile);

    res.pipe(stream);
    res.on('end', function (err, stdout, stderr) {
      if (err) return callback(Errors.getMessage(err));
      if (stderr) result.stderr = stderr;
      if (stdout) result.stdout = stdout;
      result.msg = Path.basename(outFile) + ' downloaded to ' + dir + '.';
      result.outFile = outFile;
      callback(null, result);
    });
  });
};

/*
 * Wipes all project logs for a given project
 * @param {integer} projectId - project id
 * @param {function} callback - callback function
*/
// ----------------------------------------------------------------------------
Project.prototype.clearLogs = function (projectId, callback) {
  Librarian.project.clearLogs(
    projectId, UserConfig.data.apiKey, function (err, res) {
      if (err) return callback(Errors.getMessage(err));
      if (res.statusCode === NOT_FOUND) {
        return callback('Problem clearing logs: ' + res.statusCode);
      }
      callback(null, res);
    });
};

/*
 * Streams log for the specified project.
 * @param {String} projectId The project ID.
 * @param {function} callback.
 */
// ----------------------------------------------------------------------------
Project.prototype.streamLogs = function (projectId, servos, callback) {
  // TODO: add param for prefix?
  Modulus.io.success('Log streaming started (ctrl-c to exit)...');
  if (!Array.isArray(servos)) servos = [servos];

  servos.forEach(function (servo) {
    var endpoint, h, done, tr, req, disconnected = false;
    endpoint = Util.format('%s://%s:%s/project/%s/logs/stream?authToken=%s&servoId=%s',
      Librarian._http._ssl ? 'https' : 'http',
      Librarian._http._host,
      Librarian._http._port,
      projectId,
      UserConfig.data.apiKey,
      servo.id);

    h = Librarian._http._ssl ? Https : Http;
    disconnected = false;

    done = function () {
      if (!disconnected) {
        disconnected = true;
        return callback();
      }
    };

    tr = Through(function (line) {
      var prefix = servo.id.substr(0, PREFIX_SUBSTRING);
      line = Util.format('%s> %s\n', prefix, line);
      this.queue(line);
    });

    req = h.get(endpoint, function (res) {
      if (servos.length > 1) res.pipe(Split()).pipe(tr).pipe(process.stdout);
      else res.pipe(process.stdout);
      res.on('error', function () {
        done();
      });

      res.on('close', function () {
        done();
      });

      res.on('end', function () {
        done();
      });
    });

    req.on('error', function () {
      done();
    });
  });
};

// ----------------------------------------------------------------------------
Project.prototype.scale = function (projectId, instances, await, callback) {
  Librarian.project.scale(
    projectId, instances, UserConfig.data.apiKey, function (err) {
      var dbar, checkStatus;

      if (err) return callback(Errors.getMessage(err));
      checkStatus = function () {
        Librarian.project.find(
          { projectId: projectId },
          UserConfig.data.apiKey,
          function (err, proj) {
            if (err) return callback(Errors.getMessage(err));
            if (proj.status.toLowerCase() === Project.status.running) {
              Modulus.io.stopIndeterminate(dbar);
              print(' ');
              return callback(null, proj);
            }

            setTimeout(checkStatus, TIMEOUT);
          });
      };

      if (await) {
        dbar = new Progress.Indeterminate('Scaling [:bar]');
        Modulus.io.startIndeterminate(dbar);
        setTimeout(checkStatus, TIMEOUT);
      } else {
        return callback();
      }
    });
};

// -----------------------------------------------------------------------------
/**
 * Downloads the source code as a tarball for the specified project id.
 * @param {string} projectId - the ID of the project.
 * @param {string} projectName - the name of the project
 * @param {string} outLocation - the path to the directory where the tarball should be downloaded
 * @param {function} callback - function invoked with the file stream. Responsible for the actual download.
 */
// -----------------------------------------------------------------------------
Project.prototype.download = function (projectId, projectName, outLocation, callback) {
  librarian.project.download(projectId, userConfig.data.apiKey, function (err, req, res) {
    var message, date, outFile, dir, stream, result = {};

    if (err) return callback(Errors.getMessage(err));

    date = new Date().toISOString().replace(/:/g, '.');
    outFile = projectName + '_' + date + '.zip';

    if (typeof outLocation === 'string') {
      outFile = outLocation;
      outFile = outFile.replace(/\//g, '/');
      if (outFile.substring(outFile.length-4) !== '.zip') outFile += '.zip';

      message = 'Directory ' + path.dirname(outLocation) + ' does not exist.';
      if (!fs.existsSync(path.dirname(outLocation))) return callback(message);
    }

    if (path.dirname(outLocation) === '.') dir = process.cwd();
    else dir = path.dirname(path.resolve(outLocation));

    outFile = outFile.replace(/ /g, '_').replace(/:/g,'.').replace(/[[\]{}@~`<>()*+=%&!?,\\^$|#\s]/g,'');

    stream = fs.createWriteStream(outFile);

    res.pipe(stream).on('finish', function (err, stdout, stderr) {
      if (err) return callback(Errors.getMessage(err));
      if (stderr) result.stderr = stderr;
      if (stdout) result.stdout = stdout;

      result.msg = path.basename(outFile) + ' downloaded to ' + dir + '.';
      result.outFile = outFile;
      callback(null, result);
    });
  });
};

// ----------------------------------------------------------------------------
/*
 * Archives a project's files.
 * @param {string} dir The path to archive.
 * @param {boolean} includeModules Flag to include the node_modules folder.
 * @param {function} callback Invoked with (err, archiveFile)
 *
 */
// ----------------------------------------------------------------------------
Project.prototype.packageProject = function (dir, includeModules, cb) {
  var fname = OS.tmpDir() + '/modulus-auto-zip-' + Uuid.v4() + '.zip';
  var out = FS.createWriteStream(fname);
  var zip = new Packer();
  var ignore, error, zipAdders = [];

  var makeBytesReadable = function (bytes) {
    var precision, unit, units;
    bytes = parseFloat(bytes);
    units = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    unit = 0;
    while (bytes >= BYTE_DIV) {
      unit++;
      bytes = bytes / BYTE_DIV;
      precision = unit > 2 ? 2 : 1;
    }
    return String(bytes.toFixed(precision)) + ' ' + units[unit];
  };

  zip.pipe(out);
  ignore = Ignore({
    path: dir,
    ignoreFiles: ['.modulus-base-ignore', '.modulusignore']
  });

  // Copy the base ignore file to the output so it can be applied.
  FS.writeFileSync(Path.join(dir, '.modulus-base-ignore'),
    FS.readFileSync(Path.join(__dirname, '.modulus-base-ignore')));

  // Add node_modules to ignore file if user did not want to include it.
  if (!includeModules) {
    FS.appendFileSync(Path.join(dir, '.modulus-base-ignore'), '\nnode_modules');
  }

  ignore.on('child', function (c) {
    var filePath;
    if (c.type === 'File' || c.type === 'SymbolicLink') {
      // Incoming file could be symlink, need to check if it points to something
      // and it points to a file.
      if (FS.existsSync(c.path) && FS.statSync(c.path).isFile()) {
        // Replace Windows EOL with Unix EOL so that paths are cleaned up
        // correctly.
        filePath = c.path.replace(/\\/g, '/');

        zipAdders.push(function (done) {
          zip.entry(FS.createReadStream(c.path), {
            name: filePath.replace(dir, ''),
            mode: FS.statSync(c.path).mode
          }, done);
        });
      }
    }
  });

  error = false;

  ignore.on('error', function (err) {
    error = true;
    FS.unlinkSync(Path.join(dir, '.modulus-base-ignore'));
    cb(err, fname);
  });

  ignore.on('close', function () {
    Async.series(zipAdders, function (err) {
      if (err) return cb(err);
      zip.finish();
    });
  });

  out.on('close', function () {
    var stats = FS.statSync(fname);
    print(makeBytesReadable(stats.size.toString()).data + ' written');

    // Remove the base ignore file.
    FS.unlinkSync(Path.join(dir, '.modulus-base-ignore'));

    if (!error) return cb(null, fname);
  });
};

// ----------------------------------------------------------------------------
/*
 * Various project statuses.
 */
// ----------------------------------------------------------------------------
Project.status = {
  uploading: 'uploading',
  deploying: 'deploying',
  running: 'running',
  stopped: 'stopped'
};

module.exports = new Project();
/* eslint-enable no-underscore-dangle, no-sync */
