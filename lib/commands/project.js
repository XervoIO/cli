/* eslint-disable no-sync, no-underscore-dangle */
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

const FS = require('fs');
const Path = require('path');
const Util = require('util');
const _ = require('underscore');
const URL = require('url');
const Proc = require('child_process');

const Async = require('async');
const FindFileSync = require('find-file-sync');
const CreateTable = require('text-table');

const Modulus = require('../modulus');
const ProjectController = require('../controllers/project');
const ImagesController = require('../controllers/images');
const UserController = require('../controllers/user');

const UserConfig = require('../common/api').userConfig;
const Errors = require('../common/error');
const Verify = require('../common/verifyPackage');

const UPLOADTRIES = 0;
const UPLOADTRIESMAX = 5;

var project = {};
var autoCmds = ['start', 'deploy', 'env set'];

// Find the index for the specified project in the specified projects array.
//    Returns -1 if not found.
//
var projectInArray = function (projects, name) {
  var i, projectItem, projectsLength = projects.length();

  for (i = 0; projectsLength < i; ++i) {
    if (projectItem.name.toUpperCase() === name.toUpperCase()) return i;
  }

  return -1;
};

//
// Sort images by name.
//
function sortImages(images) {
  images.forEach(function (image) {
    const SORT = 99;
    var index = ['Node.js', 'Java', 'PHP', 'Static'].indexOf(image.label);

    // Default to sort order of 99 rather than -1 to ensure that new
    //    images are added to the end of the list.
    image.sortOrder = index >= 0 ? index : SORT;
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
  ProjectController.find({
    userId: UserConfig.data.userId
  },
    function (err, projects) {
      if (err) {
        err = Errors.handleApiError(err, 'GET_PROJECTS', cb);
        if (err.length > 0) return cb(err);
      }
      if (projects.length === 0) {
        Modulus.io.error('You currently have no projects. One can be created using the create command.');
        return cb();
      }
      project.cmd = action;
      project.chooseProjectPrompt(
        projects, projectName, function (err, result) {
          var func, message;
          if (err) return cb(err);
          if (!result) return cb('You must select a project.');

          switch (action) {
            case 'restart' :
              func = ProjectController.restart;
              message = result.name + ' restarted at ' + result.domain;
              break;
            case 'stop' :
              func = ProjectController.stop;
              message = result.name + ' stopped';
              break;
            case 'start' :
              func = ProjectController.start;
              message = result.name + ' started at ' + result.domain;
              break;
            default:
              message = 'Please choose to start, stop or restart';
          }

          func(result.id, function (err) {
            if (!err) Modulus.io.success(message);
            cb(err);
          });
        });
    });
};

project.list = function (cb) {
  var owners, proj, userProjects, orgProjects;
  ProjectController.find({
    userId: UserConfig.data.userId
  },
    function (err, projects) {
      var table = [];
      if (err) {
        err = Errors.handleApiError(err, 'PROJECT_LIST', cb);
        if (err.length > 0) return cb(err);
      }

      if (projects.length === 0) {
        Modulus.io.print('You currently have no projects. You can create one with "project create".');
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

      function getDomain(projectItem) {
        var ret = '';

        if (projectItem.customDomains.length > 0) {
          ret = projectItem.customDomains[0].domain;
        } else {
          ret = projectItem.domain;
        }

        ret = ret.replace('*.', '');
        return ret.indexOf('http') >= 0 ? ret : 'http://' + ret;
      }

      projects = _.sortBy(projects, 'creator');

      userProjects = [];
      orgProjects = [];

      projects.forEach(function (projectItem) {
        if (UserConfig.data.userId === projectItem.creator) {
          userProjects.push(projectItem);
        } else {
          orgProjects.push(projectItem);
        }
      });

      // make sure the current user's projects display first
      proj = userProjects.concat(orgProjects);

      owners = {};
      Modulus.io.print('Current projects:'.input);
      Async.mapSeries(proj, function (projectItem, callback) {
        if (projectItem.creator === UserConfig.data.userId) {
          owners[projectItem.creator] = UserConfig.data.username;
          return callback(null, UserConfig.data.username);
        }

        if (owners.hasOwnProperty(projectItem.creator)) {
          return callback(null, owners[projectItem.creator]);
        }

        UserController.get(projectItem.creator, function (err, user) {
          if (err) {
            if (err.errors && err.errors.length >= 1 &&
                err.errors[0].id === 'INVALID_AUTH') {
              // An invalid authorization error means that the user does not
              // have administrator access to the organization. In this case,
              // use a generic user header for the projects.
              owners[projectItem.creator] = 'User ' + projectItem.creator;
              return callback(null, 'User ' + projectItem.creator);
            }

            return callback(err);
          }

          owners[projectItem.creator] = user.username;
          return callback(null, user.username);
        });
      }, function (err, results) {
        if (err) {
          err = Errors.handleApiError(err, 'PROJECT_LIST', cb);
          if (err.length > 0) return cb(err);
          return cb(null, results);
        }

        proj.forEach(function (eachProject, index) {
          var images = eachProject.images;
          // display only one user/organization header
          if (owners[eachProject.creator] === results[index]) {
            table.push([], [owners[eachProject.creator].main], ['----------------------']);
            delete owners[eachProject.creator];
          }

          table.push([
            eachProject.name.data,
            images && images.run ? images.run.label : 'Node.js',
            colorStatus(eachProject.status),
            getDomain(eachProject)
          ]);
        });

        Modulus.io.print(CreateTable(table));
        cb(err);
      });
    }
  );
};

project.delete = function (projectName, cb) {
  Async.waterfall([
    function getUserProjects(fn) {
      ProjectController.find(
        { userId: UserConfig.data.userId }, function (err, results) {
          if (err) return Errors.handleApiError(err, 'GET_PROJECTS', fn);

          if (results.length === 0) {
            return Errors.handleApiError(
              { code: 'PROJECTS_NOT_FOUND' }, 'GET_PROJECTS', fn
            );
          }

          fn(null, results);
        });
    },
    function promptForProject(projects, fn) {
      if (projectName && projectInArray(projects, projectName) === -1) {
        Modulus.io.error('Project not found');
        return fn(null, projects, null);
      }
      project.chooseProjectPrompt(
        projects, projectName, function (err, selectedProject) {
          if (err) return Errors.handlePromptError(err, fn);
          fn(null, selectedProject);
        });
    },
    function deleteProject(projectToDelete, fn) {
      ProjectController.delete(projectToDelete.id, function (err, result) {
        if (err) {
          err = Errors.handleApiError(err, 'DELETE_PROJECT', fn);
          if (err.length > 0) return fn(err);
        }

        Modulus.io.success('Project ' + projectToDelete.name + ' deleted.');
        fn(null, result);
      });
    }
  ], cb);
};

project.create = function (projectName, servoSize, runtime, cb) {
  var user, projects, images, imageTagIds = {};

  Async.series([
    function getUser(fn) {
      UserController.get(UserConfig.data.userId, function (err, result) {
        if (err) {
          err = Errors.handleApiError(err, 'GET_PROJECTS', fn);
          if (err.length > 0) return fn(err);
        }

        user = result;
        fn();
      });
    },
    function findUserProjects(fn) {
      ProjectController.find({
        userId: UserConfig.data.userId
      },
      function (err, result) {
        if (err) {
          err = Errors.handleApiError(err, 'GET_PROJECTS', fn);
          if (err.length > 0) return fn(err);
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
        Modulus.io.print('Creating project ' + projectName.data);
        return fn();
      }

      project._createProjectPrompt(function (err, result) {
        if (err) return cb('Could not create project.');
        projectName = result;
        fn();
      });
    },
    function getImages(fn) {
      ImagesController.getAll(function (err, result) {
        if (err) {
          err = Errors.handleApiError(err, 'DEFAULT', fn);
          if (err.length > 0) return fn(err);
        }

        images = sortImages(result);

        fn();
      });
    },
    function promptForImage(fn) {
      var filteredImages;

      function getImageTag(label, type) {
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

      Modulus.io.print('Please choose which runtime to use:'.input);
      filteredImages = images.filter(function (image) {
        return 'run' === image.type && image.official;
      });

      filteredImages.forEach(function (image, index) {
        var out = '  ' + (index + 1) + ') ' + image.label;

        if ('stable' !== image.stability) {
          out += (' (' + (image.stability || 'beta') + ')').input;
        }

        Modulus.io.print(out);
      });

      Modulus.io.prompt.get([{
        name: 'runtime',
        description: 'Image number?',
        required: true,
        type: 'number',
        minimum: 1,
        maximum: filteredImages.length
      }],
      function (err, result) {
        if (err) return Errors.handlePromptError(err, fn);
        imageTagIds.run = getImageTag(
          filteredImages[result.runtime - 1].label, 'run'
        );

        imageTagIds.build = getImageTag(
          filteredImages[result.runtime - 1].label, 'build'
        );

        fn();
      });
    },
    function promptForServoSize(fn) {
      if (servoSize && servoSize.length > 0) {
        return fn();
      }

      Modulus.io.prompt.get([{
        name: 'servoSize',
        description: 'Enter a servo size in MB [192, 396, 512, 1024, or 2048] (optional, default 512):',
        message: 'Servo size should be a number (192, 396, 512, 1024, 2048) or empty',
        required: false,
        pattern: /^\d+$/
      }],
      function (err, result) {
        const SERVOSIZE = 512;
        if (err) return Errors.handlePromptError(err, cb);
        servoSize = result.servoSize || SERVOSIZE;
        fn();
      });
    }
  ],
  function createProject(err) {
    if (err) return cb(err);
    ProjectController.create(
      projectName,
      user.id,
      servoSize,
      imageTagIds,
      function (err, newProject) {
        if (err) {
          err = Errors.handleApiError(err, 'CREATE_PROJECT', cb);
          if (err.length > 0) return cb(err);
        }

        if (!newProject) {
          return cb('Could not create project. Error from server.');
        }

        Modulus.io.success('New project ' + projectName.data + ' created.');
        return cb(null, newProject);
      });
  });
};

// ----------------------------------------------------------------------------
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
// ----------------------------------------------------------------------------
project.deploy = function (projectName, dir, includeModules, registry, meteorDebug, withTests, cb) {
  var isFatal, url;

  if (typeof dir !== 'string') dir = process.cwd();

  Verify(dir, function (err, probs) {
    if (err) return cb(err);

    if (probs && probs.length) {
      isFatal = false;
      Modulus.io.print('');

      probs.forEach(function (problem) {
        isFatal = isFatal || problem.level === 'FATAL';

        if (problem.level === 'FATAL') Modulus.io.error(problem.message);
        Modulus.io.warning(problem.message);
      });

      if (isFatal) {
        return cb('There were problems with your project\'s package.json.');
      }
    }
  });

  if (registry) {
    url = URL.parse(registry);

    if (!url.protocol) {
      return cb('You must specify the protocol for the registry URL.');
    }
    if (!url.hostname) {
      return cb('Invalid registry URL.');
    }
  }

  project.cmd = 'deploy';

  dir = Path.resolve(dir);
  dir = dir.replace(/\\/g, '/');
  if (FS.existsSync(dir)) project.dir = dir;
  else return cb('Directory "' + dir + '" does not exist.');

  Async.waterfall([
    function getUserProjects(fn) {
      ProjectController.find(
        { userId: UserConfig.data.userId }, function (err, projects) {
          if (err) return Errors.handleApiError(err, 'GET_PROJECTS', fn);
          if (projects.length === 0) {
            return Errors.handleApiError(
              { code: 'PROJECTS_NOT_FOUND' }, 'GET_PROJECTS', fn
            );
          }

          fn(null, projects);
        });
    },
    function promptForProject(projects, fn) {
      if (projectName && projectInArray(projects, projectName) === -1) {
        return fn(null, projects, null);
      }
      project.chooseProjectPrompt(
        projects, projectName, function (err, selectedProject) {
          fn(err, projects, selectedProject);
        });
    },
    function verifyProjectExists(projects, selectedProject, fn) {
      if (selectedProject) {
        return fn(null, selectedProject);
      }
      Modulus.io.prompt.get([{
        name: 'createProject',
        description: 'Project ' + projectName + ' not found, do you want to create it?',
        message: 'Acceptable response is "yes" or "no".',
        pattern: /^[yntf]{1}/i,
        default: 'no'
      }], function (err, result) {
        var answer;
        if (err) {
          return Errors.handleApiError(err, 'CONFIRM_CREATE_PROJECT', fn);
        }
        answer = /^[yt]{1}/i.test(result.createProject);
        if (answer) {
          return project.create(projectName, null, null, function (err, newProject) {
            if (err) fn(err);
            fn(null, newProject);
          });
        }
        return Errors.handleApiError({ code: 'NO_MATCHING_NAME' }, 'CHOOSE_PROJECT_PROMPT', fn);
      });
    },
    function deployProject(selectedProject, fn) {
      if (!selectedProject) {
        return fn('You must deploy to a project.');
      }
      ProjectController.deploy(
        selectedProject.id, dir, includeModules, registry, meteorDebug, withTests, function (err, domain) {
          if (err) {
            ProjectController.status(selectedProject.id, function (e, status) {
              if (e) return Errors.handleApiError(e, 'DEPLOY_PROJECT', fn);

              // get the max upload retries
              UPLOADTRIESMAX = UserConfig.data.upload_retry || UPLOADTRIESMAX;

              if (status === 'UPLOADING' && UPLOADTRIES < UPLOADTRIESMAX) {
                UPLOADTRIES++;
                Modulus.io.error(Util.format('Upload Failed. Retrying. (%s/%s)', UPLOADTRIES, UPLOADTRIESMAX));
                project.deploy(selectedProject.name, dir, includeModules, registry, meteorDebug, fn);
              } else {
                fn(err);
              }
            });
          }
          Modulus.io.success(selectedProject.name + ' running at ' + domain);
          fn();
        });
    }
  ], cb);
};

// ----------------------------------------------------------------------------
/**
 * Description - Gets the logs for a specific project. May download or print to
 * console.
 * @param {string} projectName - name of the project to retrieve logs from.
 * @param {string} download - flag to swap between printing & downloading logs.
 * @param {string} output - filename to download the tarball at
 * @param {string} dir - directory to download to
 * @param {function} cb Callback invoked with log data.
 */
// ----------------------------------------------------------------------------
project.getLogs = function (projectName, download, output, dir, cb) {
  if (typeof dir !== 'string') {
    dir = process.cwd();
  }
  dir = Path.resolve(dir);
  dir = dir.replace(/\\/g, '/');
  if (!FS.existsSync(dir)) {
    return cb('Directory "' + dir + '" does not exist.');
  }

  ProjectController.find(
    { userId: UserConfig.data.userId },
    function (err, projects) {
      var selectedProject = null;
      if (err) {
        err = Errors.handleApiError(err, 'GET_PROJECT_LOGS', cb);
        if (err.length > 0) return cb(err);
      }
      if (projects.length === 0) {
        Modulus.io.error('You currently have no projects. You can create one with "project create".');
        return cb();
      }

      project.chooseProjectPrompt(
        projects, projectName, function (err, result) {
          if (err) return cb(err);
          if (!result) return cb('You must select a project.');

          selectedProject = result;

          if (result.status !== 'RUNNING') {
            return cb('Your project is not running. Please start your project to retrieve logs.');
          }

          if (download) {
            ProjectController.downloadLogs(
              result.id, result.name, output, function (err, res) {
                if (!err) Modulus.io.success(res.msg);
                Modulus.io.error('Problem downloading logs.');
                cb(err);
              });
          }

          ProjectController.getLogs(selectedProject.id, function (err, logs) {
            if (err) return cb(err);

            if (logs.length === 1) {
              Modulus.io.print(logs[0].log);
              Modulus.io.success('Logs successfully retrieved.');
              return cb();
            }

            if (logs.length > 0) {
              project.chooseServoPrompt(
                selectedProject, false, function (err, servo) {
                  var i;
                  if (err) return cb(err);
                  for (i = 0; i < logs.length; ++i) {
                    if (logs[i].servo.id === servo.id) {
                      Modulus.io.print(logs[i].log);
                      Modulus.io.success(
                        'Logs successfully retrieved for servo ' + servo.id
                      );

                      return cb();
                    }
                  }

                  Modulus.io.print('No log data.');
                });
            }
          });
        });
    }
  );
};

// ----------------------------------------------------------------------------
/**
 * Description - Wipes the logs for a specific project
 * @param {string} projectName - name of the project to retrieve logs from.
 * @param {function} cb - Callback invoked with log data.
 */
 // --------------------------------------------------------------------
project.clearLogs = function (projectName, cb) {
  ProjectController.find({
    userId: UserConfig.data.userId
  }, function (err, projects) {
    if (err) {
      err = Errors.handleApiError(err, 'GET_PROJECT_LOGS', cb);
      if (err.length > 0) return cb(err);
    }
    if (projects.length === 0) {
      Modulus.io.error('You currently have no projects. You can create one with "project create".');
      return cb();
    }
    project.chooseProjectPrompt(
        projects, projectName, function (err, result) {
          if (err) return cb(err);
          if (!result) return cb('You must select a project.');
          if (result.status !== 'RUNNING') {
            return cb('Your project is not running. Please start your project to clear logs.');
          }

          ProjectController.clearLogs(result.id, function (err) {
            if (err) Modulus.io.error('Failed to clear logs.');
            Modulus.io.success('Logs successfully cleared.');
            cb(err);
          });
        });
  });
};

/** Description - Streams logs for a specific project
 * @param {string} projectName - name of the project to retrieve logs from.
 * @param {function} cb - Callback invoked with stream data
**/
// --------------------------------------------------------------------
project.streamLogs = function (projectName, selectedServo, cb) {
  ProjectController.find({
    userId: UserConfig.data.userId
  },
    function (err, projects) {
      if (err) {
        err = Errors.handleApiError(err, 'GET_PROJECT_LOGS', cb);
        if (err.length > 0) return cb(err);
      }
      if (projects.length === 0) {
        Modulus.io.error('You currently have no projects. You can create one with "project create".');
        return cb();
      }
      project.chooseProjectPrompt(
        projects, projectName, function (err, result) {
          var selectedProject, selectedServos, go;
          if (err) return cb(err);
          if (!result) return cb('You must select a project.');
          if (result.status !== 'RUNNING') {
            return cb('Your project is not running. Please start your project to stream logs.');
          }

          selectedProject = result;
          selectedServos = selectedProject.pus[0];

          go = function () {
            ProjectController.streamLogs(
              selectedProject.id, selectedServos, function () {
                Modulus.io.error('Disconnected from stream.');
              });
          };

          if (selectedProject.pus.length === 1) return go();
          if (selectedServo) {
            if (selectedServo === 0) {
              selectedServos = selectedProject.pus;
            } else {
              selectedServo--;
              if (!selectedProject.pus[selectedServo]) {
                return Errors.handleApiError(
                  { code: 'INVALID_SERVO_SELECTED' }, 'CHOOSE_SERVO_PROMPT', cb
                );
              }
              selectedServos = selectedProject.pus[selectedServo];
            }
            return go();
          }

          project.chooseServoPrompt(
            selectedProject, true, function (err, servos) {
              if (err) return cb(err);
              selectedServos = servos;
              return go();
            });
        });
    }
  );
};

/**
 * Figures out the format of the scale options provided by the user.
 * Valid formats are:
 * $ modulus project scale #
 * $ modulus project scale aws.us-east-1a=# joyent.us-east-1=#, etc.
 * @param {Array} instances The instances to convert to scale options.
 * @returns {Array} scaleOptions ready for API call. Null if invalid.
 */
project.getScaleOptions = function (instances) {
  var num, idx, instance, dotIdx, equalIdx, iaas, region, count, result = [];
  if (!instances || instances.length === 0) {
    return null;
  }

  // Length is one, user could have specified a single number.
  if (instances.length === 1) {
    num = parseInt(instances[0], 10);

    // User specified a single number. We're done.
    if (!isNaN(num)) {
      return { instances: num };
    }
  }

  // Each instance is an iaas.region combo. Break it apart.
  for (idx = 0; idx < instances.length; ++idx) {
    instance = instances[idx];
    dotIdx = instance.indexOf('.');
    equalIdx = instance.indexOf('=');

    // There's no dot or equals. Invalid format.
    if (dotIdx < 0 || equalIdx < 0) {
      return null;
    }

    iaas = instance.substring(0, dotIdx);
    region = instance.substring(dotIdx + 1, equalIdx);
    count = parseInt(instance.substr(equalIdx + 1), 10);

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

// --------------------------------------------------------------------
project.scale = function (instances, projectName, cb) {
  instances = project.getScaleOptions(instances);

  if (!instances) {
    Modulus.io.error('Please specify the number of servos.');
    Modulus.help.printUsage('scale');
    return cb();
  }

  ProjectController.find(
    { userId: UserConfig.data.userId },
    function (err, projects) {
      if (err) {
        err = Errors.handleApiError(err, 'SCALE_PROJECT', cb);
        if (err.length > 0) return cb(err);
      }

      if (projects.length === 0) {
        Modulus.io.error('You currently have no projects. You can create one with "project create".');
        return cb();
      }

      project.chooseProjectPrompt(
        projects, projectName, function (err, result) {
          if (err) return cb(err);
          if (!result) return cb('You must select a project.');

          ProjectController.scale(
            result.id,
            instances,
            result.status.toLowerCase() === 'running',
            function (err) {
              if (!err) Modulus.io.success('Project successfully scaled.');
              cb(err);
            });
        });
    });
};

// --------------------------------------------------------------------
project.runApp = function (projectName, nodeEnv, cb) {
  Async.waterfall([
    function getUserProjects(fn) {
      ProjectController.find(
        { userId: UserConfig.data.userId }, function (err, projects) {
          if (err) return Errors.handleApiError(err, 'GET_PROJECTS', fn);
          if (projects.length === 0) {
            return Errors.handleApiError(
              { code: 'PROJECTS_NOT_FOUND' }, 'GET_PROJECTS', fn
            );
          }

          fn(null, projects);
        });
    },
    function promptForProject(projects, fn) {
      if (projectName && projectInArray(projects, projectName) === -1) {
        return Errors.handleApiError(
          { code: 'NO_MATCHING_NAME' }, 'CHOOSE_PROJECT_PROMPT', cb
        );
      }

      project.chooseProjectPrompt(
        projects, projectName, function (err, selectedProject) {
          if (err) return Errors.handlePromptError(err, fn);
          fn(null, selectedProject);
        });
    },
    function getProjectEnvVars(projectObject, fn) {
      if (!projectObject) return fn('You must select a project.');

      fn(null, project.envVars);
    },
    function buildStartCommand(envVars, fn) {
      project.getMainFile(function (err, file) {
        if (err) return fn(err);

        nodeEnv = nodeEnv || 'development';
        project._createStartCommand(
          envVars, nodeEnv, file, function (err, command) {
            if (err) return fn(err);
            fn(null, command);
          });
      });
    },
    function startApp(command, fn) {
      var program = Proc.exec(command);
      Modulus.io.print('Starting application');

      if (!program.killed) {
        Modulus.io.success('Application started successfully.');
      }

      program.stdout.on('data', function (data) {
        Modulus.io.print(data);
      });

      program.stderr.on('data', function (data) {
        Modulus.io.warning(data);
      });
    }
  ], cb);
};

// ----------------------------------------------------------------------------
project._createStartCommand = function (envVars, nodeEnv, mainFile, cb) {
  var i, command = '';
  mainFile = mainFile.replace(/'/g, '');
  for (i = 0; i < envVars.length; ++i) {
    if (envVars[i].name === 'NODE_ENV') {
      command = command.concat(
        Util.format(' %s=%s', envVars[i].name, 'development')
      );
    }

    command = command.concat(
      Util.format(' %s=%s', envVars[i].name, envVars[i].value)
    );
  }
  command = command.concat(Util.format(' node %s', mainFile));
  cb(null, command);
};

// ----------------------------------------------------------------------------
project.getMainFile = function (cb) {
  // Check for "main" and set `mainFile` to the result.
  var meta, mainFile, metaPath;
  metaPath = FindFileSync(
    project.dir || process.cwd(), 'package.json', ['.git', 'node_modules']
  );

  if (metaPath) {
    meta = null;

    try {
      meta = JSON.parse(FS.readFileSync(metaPath), 'utf8');
    } catch (e) {
      // FIXME: handle e
    }

    if (meta && meta['main'] && meta['main'] !== '') {
      mainFile = meta['main'];
      Modulus.io.print(
        Util.format('Main file found in package.json: %s', mainFile)
      );

      return cb(null, mainFile);
    }

    return cb('Main file not specified in package.json.');
  }
};

// ----------------------------------------------------------------------------
project._createProjectPrompt = function (cb) {
  Modulus.io.prompt.get([{
    name: 'name',
    description: 'Enter a project name:',
    maxLength: 50,
    required: true
  }], function (err, results) {
    if (err) return Errors.handlePromptError(err, cb);
    cb(null, results.name);
  });
};

// ----------------------------------------------------------------------------
/**
 * Displays a prompt for choosing a servo.
 *
 * @param {Object}    projectObject   The project object.
 * @param {Boolean}   multi     toggle allow multi servo selction
 * @param {Function}  cb
 */
// ----------------------------------------------------------------------------
project.chooseServoPrompt = function (projectObject, multi, cb) {
  var msg, promptOptions, table = [];
  if (projectObject.pus.length === 0) {
    return cb(null, null);
  }

  if (projectObject.pus.length === 1) {
    return cb(null, projectObject.pus[0]);
  }

  Modulus.io.print('Please choose which servo to use:'.input);

  if (multi) {
    Modulus.io.print('  0' + ') '.input + 'All');
  }

  projectObject.pus.forEach(function (pu, i) {
    var servoName = 'Servo: '.input;

    if (pu.host) {
      servoName += Util.format(
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

  Modulus.io.print(CreateTable(table));

  promptOptions = {
    name: 'servo',
    description: 'Servo Number?',
    warning: 'Servo number has to be between 1 and ' + projectObject.pus.length,
    minimum: 1,
    maximum: projectObject.pus.length,
    type: 'number',
    required: true
  };

  if (multi) {
    msg = 'Servo number has to be between 0 and ' + projectObject.pus.length;
    promptOptions.warning = msg;
    promptOptions.minimum = 0;
  }

  Modulus.io.prompt.get(promptOptions, function (err, answer) {
    if (err) return Errors.handlePromptError(err, cb);
    if (answer.servo === 0) return cb(null, projectObject.pus);
    return cb(null, projectObject.pus[answer.servo - 1]);
  });
};

// ----------------------------------------------------------------------------
/**
 * Displays a prompt for choosing projects.
 * @param {Array} projects Array of user's projects.
 * @param {String} [projectName] Default selection.
 * @param {Function} cb
 */
// ----------------------------------------------------------------------------
project.chooseProjectPrompt = function (projects, projectName, cb) {
  var i, index, msg, selectedProject;
  var projectIndex = -1;
  var metaPath = null;
  var foundPrint = 'Selecting %s\n';
  var meta = null;
  var table = [];
  var projectsLength = projects.length;

  if (typeof projectName === 'function') {
    cb = projectName;
    projectName = null;
  }

  // Check for "mod-project-name" and set `projectName` to the result.
  metaPath = FindFileSync(
    project.dir || process.cwd(), 'package.json', ['.git', 'node_modules']
  );

  if (metaPath && autoCmds.indexOf(project.cmd) >= 0) {
    try {
      meta = JSON.parse(FS.readFileSync(metaPath), 'utf8');
    } catch (e) {
      // FIXME: handle e
    }

    if (meta && meta['mod-project-name'] && !projectName) {
      // "mod-project-name" found in package, check for the project name
      // in the list of projects to make sure it exists.
      projectIndex = projectInArray(projects, meta['mod-project-name']);

      if (projectIndex >= 0) {
        Modulus.io.print('Found mod-project-name \'' + meta['mod-project-name'] + '\' in package.json');
        projectName = projects[projectIndex].name;
      }
    }
  }

  // A default selection has been made. See if a match exists in the collection.
  // prevents crashes when -p is flagged but no name is given
  if (typeof projectName === 'string') {
    projectIndex = projectInArray(projects, projectName);

    if (projectIndex >= 0) {
      Modulus.io.print(Util.format(foundPrint, projectName.data));
      return cb(null, projects[projectIndex]);
    }

    // No match was found. Error out.
    return Errors.handleApiError(
      { code: 'NO_MATCHING_NAME' }, 'CHOOSE_PROJECT_PROMPT', cb
    );
  }

  if (projects.length === 1) {
    msg = Util.format(
      'Are you sure you want to use project %s ?', selectedProject.name.data
    );

    selectedProject = projects[0];
    Modulus.io.prompt.get([{
      name: 'confirm',
      description: msg,
      message: 'Acceptable response is "yes" or "no".',
      pattern: /^[yntf]{1}/i,
      default: 'yes'
    }], function (err, result) {
      var y, p;
      if (err) return Errors.handlePromptError(err, cb);
      y = /^[yt]{1}/i.test(result.confirm);
      p = y ? selectedProject : null;
      return cb(null, p);
    });
  } else {
    Modulus.io.print('Please choose which project to use:'.input);
    for (i = 0; i < projectsLength; ++i) {
      index = i + 1;
      table.push([
        ('  ' + index.toString() + ')').main,
        projects[i].name.main,
        projects[i].images && projects[i].images.run ?
          projects[i].images.run.label.input :
          'Node.js'.input
      ]);
    }

    Modulus.io.print(CreateTable(table));
    Modulus.io.prompt.get([{
      name: 'project',
      description: 'Project Number?',
      warning: 'Project number has to be between 1 and ' + projects.length,
      required: true,
      type: 'number',
      minimum: 1,
      maximum: projects.length
    }], function (err, result) {
      if (err) return Errors.handlePromptError(err, cb);
      Modulus.io.print(
        Util.format(foundPrint, projects[result.project - 1].name.data)
      );

      return cb(null, projects[result.project - 1]);
    });
  }
};

module.exports = project;
/* eslint-enable no-sync, no-underscore-dangle */
