/* eslint-disable no-underscore-dangle */
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

const Async = require('async');
const Util = require('util');

const AddOnController = require('../controllers/addOn');
const Errors = require('../common/error');
const Modulus = require('../modulus');
const ProjectController = require('../controllers/project');
const UserConfig = require('../common/api').userConfig;

var env = {};
var print = Modulus.io.print;

/**
 * Gets the specified environment variable for the specified project.
 * @param {String} projectName Project to get the environment variable value
 *    for.
 * @param {String} name Environment variable name.
 * @param {Function} cb Callback function.
 */
env.get = function (projectName, name, cb) {
  env._getAndChooseProject(projectName, function (err, project) {
    var i;
    if (err) return cb(err);

    for (i = 0; i < project.envVars.length; ++i) {
      if (project.envVars[i].name === name) {
        env._printEnv(project.envVars[i]);
        return cb();
      }
    }

    return cb(
      'Variable ' + name.yellow + ' not found in project ' + project.name.data
    );
  });
};

/**
 * Export environment variables from a project into the file.
 * @param {String} projectName Project to set the variables for.
 * @param {String} file Path to write the environment variables to.
 * @param {Function} done Callback function.
 */
env.export = function (projectName, file, done) {
  var filePath = Path.normalize(file);

  env._getAndChooseProject(projectName, function (err, project) {
    var envVars = {};
    if (err) return done(err);

    project.envVars.forEach(function (v) {
      var isString = typeof v.value === 'string';
      envVars[v.name] = isString ? v.value : JSON.stringify(v.value);
    });

    FS.writeFile(filePath, JSON.stringify(envVars, null, 2), function (fsErr) {
      if (fsErr) {
        return done(
          Errors.handleApiError({ code: 'INVALID_FILE' }, 'EXPORT_VARS', done)
        );
      }
      Modulus.io.success('Successfully exported environment variables.');
      done();
    });
  });
};

/**
 * List all environment variables for the specified project.
 * @param {String} projectName Name of the project to get environment variables
 *    for.
 * @param {Function} cb Callback function.
 */
env.list = function (projectName, cb) {
  var project;

  Async.waterfall([
    function (callback) {
      env._getAndChooseProject(projectName, callback);
    },

    function (pro, callback) {
      project = pro;
      print('Project ' + project.name.data + ' Environment Variables');

      AddOnController.getConfigVars(project.id, callback);
    },

    function (addonVars, callback) {
      var i;
      for (i = 0; i < project.envVars.length; ++i) {
        env._printEnv(project.envVars[i]);
      }

      if (addonVars.length > 0) {
        print('\nAdd-Ons');

        for (i = 0; i < addonVars.length; ++i) {
          env._printEnv(addonVars[i]);
        }
      }

      callback(null);
    }
  ],
  function (err) {
    if (err) return cb(err);
    cb();
  });
};

/**
 * Set the specified environment variable to the specified value for the
 *    specified project.
 * @param {String} projectName Name of the project to update environment
 *    variable for.
 * @param {String} name Environment variable to set.
 * @param {String} value Value to set the environment variable to.
 * @param {Function} cb Callback function.
 */
env.set = function (projectName, name, value, cb) {
  Modulus.commands.project.cmd = 'env set';
  env._getAndChooseProject(projectName, function (err, project) {
    var i, found, newEnv;
    if (err) return cb(err);

    newEnv = { name: name, value: value };
    found = false;
    print(
      'Setting ' + newEnv.name.yellow + ' for project ' + project.name.data
    );

    for (i = 0; i < project.envVars.length; ++i) {
      if (project.envVars[i].name === newEnv.name) {
        project.envVars[i].value = newEnv.value;
        found = true;
      }
    }

    if (!found) {
      project.envVars.push(newEnv);
    }

    ProjectController.saveVars(project.id, project.envVars, function (err) {
      if (err) {
        err = Errors.handleApiError(err, 'SET_VARS', cb);
        if (err.length > 0) return cb(err);
      }

      Modulus.io.success('Successfully set environment variable.');
      return cb();
    });
  });
};

/**
 * Load environment variables from a file and set them for the specified
 *    project.
 * @param {String} projectName Project to set the variables for.
 * @param {String} file Path to the file with the environment variable data.
 * @param {Function} cb Callback function.
 */
env.load = function (projectName, file, cb) {
  env._getAndChooseProject(projectName, function (err, project) {
    if (err) return cb(err);

    Async.waterfall([
      function (fn) {
        FS.readFile(file, { encoding: 'utf8' }, function (err, fileData) {
          if (err) return fn({ code: 'INVALID_FILE' }, null);
          fn(null, fileData);
        });
      },
      function (json, fn) {
        var ret = null;

        try {
          ret = JSON.parse(json);
        } catch (err) {
          return fn({ code: 'INVALID_JSON' });
        }

        fn(null, ret);
      },
      function (data, fn) {
        var i, ii, key, keys = Object.keys(data);

        // Update existing values.
        for (i = 0; i < project.envVars.length; ++i) {
          if (keys.indexOf(project.envVars[i].name) >= 0) {
            try {
              key = project.envVars[i].name;

              if (typeof data[key] === 'string') {
                project.envVars[i].value = data[key];
              } else {
                project.envVars[i].value = JSON.stringify(data[key]);
              }

              keys.splice(keys.indexOf(key), 1);
            } catch (err) {
              fn({ code: 'INVALID_VALUE' });
            }
          }
        }

        // Add new values.
        for (ii = 0; ii < keys.length; ++ii) {
          if (typeof data[keys[ii]] === 'string') {
            project.envVars.push({
              name: keys[ii],
              value: data[keys[ii]]
            });
          } else {
            try {
              project.envVars.push({
                name: keys[ii],
                value: JSON.stringify(data[keys[ii]])
              });
            } catch (err) {
              fn({ code: 'INVALID_VALUE' });
            }
          }
        }

        fn(null);
      },
      function (fn) {
        ProjectController.saveVars(project.id, project.envVars, function (err) {
          if (err) return fn(err);
          fn(null);
        });
      }
    ],
    function (err) {
      if (err) {
        err = Errors.handleApiError(err, 'LOAD_VARS', cb);
        return cb(err);
      }

      Modulus.io.success(
        'Successfully set environment variables loaded from file.'
      );
    });
  });
};

/**
 * Delete the specified environment variable from the specified project.
 * @param {String} projectName Project to delete from.
 * @param {String} name Environment variable to delete.
 * @param {Function} cb Callback function.
 */
env.delete = function (projectName, name, cb) {
  env._getAndChooseProject(projectName, function (err, project) {
    var i, msg, found = false;
    if (err) return cb(err);

    print('Deleting ' + name.yellow + ' for project ' + project.name.data);
    for (i = 0; i < project.envVars.length; ++i) {
      if (project.envVars[i].name === name) {
        project.envVars.splice(i, 1);
        found = true;
        break;
      }
    }

    if (!found) {
      msg = Util.format(
        'Varibale %s not found in project %s.', name.yellow, project.name.data
      );

      return cb(msg);
    }

    ProjectController.saveVars(project.id, project.envVars, function (err) {
      if (err) {
        err = Errors.handleApiError(err, 'SET_VARS', cb);
        if (err.length > 0) return cb(err);
      }
      msg = Util.format(
        'Successfully deleted variable %s from project %s.', name.yellow, project.name.data
      );

      Modulus.io.success(msg);
      return cb();
    });
  });
};

/**
 * Attempt to find the specified project and allow user to choose from a prompt
 *    if project name is not found.
 * @param {String} projectName Project to find.
 * @param {Function} cb Callback function.
 * @private
 */
env._getAndChooseProject = function (projectName, cb) {
  if ('function' === typeof projectName) {
    cb = projectName;
    projectName = null;
  }

  ProjectController.find({
    userId: UserConfig.data.userId
  },
  function (err, projects) {
    if (err) {
      err = Errors.handleApiError(err, 'GET_PROJECTS', cb);
      if (err.length > 0) return cb(err);
    }

    if (projects.length === 0) {
      return cb('You currently have no projects. You can create one with "project create".');
    }

    Modulus.commands.project.chooseProjectPrompt(
      projects, projectName, function (err, result) {
        if (err) return cb(err);
        if (!result) return cb('You must choose a project.');

        ProjectController.find(
          { projectId: result.id },
          function (err, project) {
            if (err) {
              err = Errors.handleApiError(err, 'FIND_PROJECT', cb);
              if (err.length > 0) return cb(err);
            }

            if (!result) {
              return cb('No project found.');
            }

            return cb(null, project);
          });
      });
  });
};

/**
 * Prints the specified environment variable to stdout.
 * @param {Object} env Object containing the name and value of an environment
 *    variable.
 * @private
 */
env._printEnv = function (envItem) {
  print(envItem.name.yellow + ' = ' + envItem.value.grey);
};

module.exports = env;
/* eslint-enable no-underscore-dangle */
