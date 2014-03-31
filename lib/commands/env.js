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
    async = require('async'),
    userConfig = require('../common/api').userConfig,
    error = require('../common/error'),
    projectController = require('../controllers/project'),
    addOnController = require('../controllers/addOn'),
    fs = require('fs');

var env = {};

//-------------------------------------------------------------------------------------------------
env.get = function(projectName, name, cb) {
  env._getAndChooseProject(projectName, function(err, project) {
    if(err) { return cb(err); }

    for (var i = 0; i < project.envVars.length; i++) {
      if(project.envVars[i].name === name) {
        env._printEnv(project.envVars[i]);
        return cb();
      }
    }

    return cb('Variable ' + name.yellow + ' not found in project ' + project.name.data);
  });
};

//-------------------------------------------------------------------------------------------------
env.list = function(projectName, cb) {
  var project;

  async.waterfall([
    function(cb) {
      env._getAndChooseProject(cb);
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

//-------------------------------------------------------------------------------------------------
env.set = function(projectName, name, value, cb) {
  modulus.commands.project.cmd = 'env set';
  env._getAndChooseProject(projectName, function(err, project) {
    if(err) { return cb(err); }

    var newEnv = {name : name, value : value};
    var found = false;
    modulus.io.print('Setting ' + newEnv.name.yellow + ' for project ' + project.name.data);
    for (var i = 0; i < project.envVars.length; i++) {
      if(project.envVars[i].name === newEnv.name) {
        project.envVars[i].value = newEnv.value;
        found = true;
      }
    }
    if(!found) {
      project.envVars.push(newEnv);
    }

    projectController.saveVars(project.id, project.envVars, function(err, res) {
      if(err) {
        err = error.handleApiError(err, 'SET_VARS', cb);
        if(err.length > 0) {
          return cb(err);
        }
      }
      modulus.io.success('Successfully set environment variable.');
      return cb();
    });
  });
};

// -----------------------------------------------------------------------------
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
        projectController.saveVars(project.id, project.envVars, function(err, res) {
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

//-------------------------------------------------------------------------------------------------
env.delete = function(projectName, name, cb) {
  env._getAndChooseProject(projectName, function(err, project) {
    if(err) { return cb(err); }

    var found = false;
    modulus.io.print('Deleting ' + name.yellow + ' for project ' + project.name.data);
    for (var i = 0; i < project.envVars.length; i++) {
      if(project.envVars[i].name === name) {
        project.envVars.splice(i, 1);
        found = true;
        break;
      }
    }

    if(!found) {
      return cb('Variable ' + name.yellow + ' not found in project ' + project.name.data);
    }

    projectController.saveVars(project.id, project.envVars, function(err, res) {
      if(err) {
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

//-------------------------------------------------------------------------------------------------
env._getAndChooseProject = function(projectName, cb) {
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
        return cb('You currently have no projects. You can create one with "project create".');
      }
      modulus.commands.project.chooseProjectPrompt(projects, projectName, function(err, result) {
        if(err) {
          return cb('Could not choose project.');
        }
        if(!result) {
          return cb('You must choose a project.');
        }
        projectController.find({projectId : result.id}, function(err, project) {
          if(err) {
            err = error.handleApiError(err, 'FIND_PROJECT', cb);
            if(err.length > 0) {
              return cb(err);
            }
          }

          if(!result) {
            return cb('No project found.');
          }
          return cb(null, project);
        });
      });
    });
};

//-------------------------------------------------------------------------------------------------
env._printEnv = function(env) {
  modulus.io.print(env.name.yellow + ' = ' + env.value.grey);
};

module.exports = env;
