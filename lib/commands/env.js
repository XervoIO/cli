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
var fs                = require('fs');
var path              = require('path');

var async             = require('async');

var addOnController   = require('../controllers/addOn');
var error             = require('../common/error');
var modulus           = require('../modulus');
var projectController = require('../controllers/project');
var userConfig        = require('../common/api').userConfig;

var env               = {};

/**
 * Gets the specified environment variable for the specified project.
 * @param {String} projectName Project to get the environment variable value
 *    for.
 * @param {String} name Environment variable name.
 * @param {Function} cb Callback function.
 */
env.get = function(projectName, name, cb) {
  env._getAndChooseProject(projectName, function(err, project) {
    if (err) { return cb(err); }

    for (var i = 0; i < project.envVars.length; i++) {
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
env.export = function(projectName, file, done) {
  var filePath = path.normalize(file);

  env._getAndChooseProject(projectName, function (err, project) {
    if (err) {
      return done(err);
    }

    var envVars = {};
    project.envVars.forEach(function (v) {
      envVars[v.name] = (typeof v.value === 'string') ? v.value : JSON.stringify(v.value)
    });

    fs.writeFile(filePath, JSON.stringify(envVars, null, 2), function (fsErr) {
      if (fsErr) {
        return done(error.handleApiError({ code: 'INVALID_FILE' }, 'EXPORT_VARS', done));
      }
      modulus.io.success('Successfully exported environment variables.');
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
env.list = function(projectName, cb) {
  var project;

  async.waterfall([
    function(cb) {
      env._getAndChooseProject(projectName, cb);
    },

    function(pro, cb) {
      project = pro;
      modulus.io.print('Project ' + project.name.data + ' Environment Variables');

      addOnController.getConfigVars(project.id, cb);
    },

    function(addonVars, cb) {
      for (var i = 0; i < project.envVars.length; i++) {
        env._printEnv(project.envVars[i]);
      }

      if (addonVars.length > 0) {
        modulus.io.print('\nAdd-Ons');

        for (var c = 0; c < addonVars.length; c++) {
          env._printEnv(addonVars[c]);
        }
      }

      cb(null);
    }
  ],
  function(err) {
    if(err) {
      return cb(err);
    }

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
env.set = function(projectName, name, value, cb) {
  modulus.commands.project.cmd = 'env set';
  env._getAndChooseProject(projectName, function(err, project) {
    if (err) { return cb(err); }

    var newEnv = {name : name, value : value};
    var found = false;
    modulus.io.print('Setting ' + newEnv.name.yellow + ' for project ' + project.name.data);
    for (var i = 0; i < project.envVars.length; i++) {
      if(project.envVars[i].name === newEnv.name) {
        project.envVars[i].value = newEnv.value;
        found = true;
      }
    }

    if (!found) {
      project.envVars.push(newEnv);
    }

    projectController.saveVars(project.id, project.envVars, function(err) {
      if (err) {
        err = error.handleApiError(err, 'SET_VARS', cb);
        if (err.length > 0) {
          return cb(err);
        }
      }

      modulus.io.success('Successfully set environment variable.');
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
env.load = function(projectName, file, cb) {
  env._getAndChooseProject(projectName, function(err, project) {
    if (err) {
      return cb(err);
    }

    async.waterfall([
      function(fn) {
        fs.readFile(file, { encoding: 'utf8' }, function(err, fileData) {
          if (err) {
            return fn({ code: 'INVALID_FILE' }, null);
          }
          fn(null, fileData);
        });
      },
      function(json, fn) {
        var ret = null;

        try {
          ret = JSON.parse(json);
        } catch (err) {
          return fn({ code: 'INVALID_JSON' });
        }

        fn(null, ret);
      },
      function(data, fn) {
        var keys = Object.keys(data);

        // Update existing values.
        for (var i = 0; i < project.envVars.length; i++) {
          if (keys.indexOf(project.envVars[i].name) >= 0) {
            try {
              var key = project.envVars[i].name;

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
        for (var ii = 0; ii < keys.length; ii++) {
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
      function(fn) {
        projectController.saveVars(project.id, project.envVars, function(err) {
          if (err) {
            return fn(err);
          }
          fn(null);
        });
      }
    ],
    function(err) {
      if (err) {
        err = error.handleApiError(err, 'LOAD_VARS', cb);
        return cb(err);
      }

      modulus.io.success('Successfully set environment variables loaded from file.');
    });
  });
};

/**
 * Delete the specified environment variable from the specified project.
 * @param {String} projectName Project to delete from.
 * @param {String} name Environment variable to delete.
 * @param {Function} cb Callback function.
 */
env.delete = function(projectName, name, cb) {
  env._getAndChooseProject(projectName, function(err, project) {
    if (err) { return cb(err); }

    var found = false;
    modulus.io.print('Deleting ' + name.yellow + ' for project ' + project.name.data);
    for (var i = 0; i < project.envVars.length; i++) {
      if (project.envVars[i].name === name) {
        project.envVars.splice(i, 1);
        found = true;
        break;
      }
    }

    if (!found) {
      return cb('Variable ' + name.yellow + ' not found in project ' + project.name.data);
    }

    projectController.saveVars(project.id, project.envVars, function(err) {
      if (err) {
        err = error.handleApiError(err, 'SET_VARS', cb);
        if(err.length > 0) {
          return cb(err);
        }
      }

      modulus.io.success('Successfully deleted variable ' + name.yellow + ' from project ' + project.name.data);
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
env._getAndChooseProject = function(projectName, cb) {
  if ('function' === typeof projectName) {
    cb = projectName;
    projectName = null;
  }

  projectController.find({
    userId : userConfig.data.userId
  },
  function(err, projects) {
    if (err) {
      err = error.handleApiError(err, 'GET_PROJECTS', cb);
      if (err.length > 0) {
        return cb(err);
      }
    }

    if (projects.length === 0) {
      return cb('You currently have no projects. You can create one with "project create".');
    }

    modulus.commands.project.chooseProjectPrompt(projects, projectName, function(err, result) {
      if (err) {
        return cb(err);
      }

      if (!result) {
        return cb('You must choose a project.');
      }

      projectController.find({ projectId: result.id }, function(err, project) {
        if (err) {
          err = error.handleApiError(err, 'FIND_PROJECT', cb);
          if (err.length > 0) {
            return cb(err);
          }
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
env._printEnv = function(env) {
  modulus.io.print(env.name.yellow + ' = ' + env.value.grey);
};

module.exports = env;
