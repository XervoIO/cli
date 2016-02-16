/*
 * Copyright (c) 2015 Modulus
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
const CreateTable = require('text-table');

const Modulus = require('../modulus');
const ProjectCommand = require('./project');
const ProjectController = require('../controllers/project');
const ServoController = require('../controllers/servo');
const UserConfig = require('../common/api').userConfig;
const Errors = require('../common/error');

var servo = {};

servo.list = function (projectName, cb) {
  if (typeof projectName === 'function') {
    cb = projectName;
    projectName = null;
  }

  ProjectController.find({
    userId: UserConfig.data.userId
  },
    function (err, projects) {
      var listProjects;
      if (err) {
        err = Errors.handleApiError(err, 'GET_PROJECTS', cb);
        if (err.length > 0) return cb(err);
      }

      if (projects.length === 0) {
        Modulus.io.error('You currently have no projects. One can be created using the create command.');
        return cb();
      }

      listProjects = function (allProjects, callback) {
        var table = [];
        var filtered = [];
        var count = 0;

        allProjects.forEach(function (project) {
          table.push(
            ['  ' + project.name.data + (' (' + project.status + ')').main]
          );

          if (project.status === 'RUNNING') {
            project.pus.forEach(function (pu) {
              table.push(['    ' + (count + 1) + ') ' + pu.id]);
              filtered[count++] = pu.id;
            });
          } else {
            table.push(['    No servos.']);
          }
        });

        Modulus.io.print(CreateTable(table));
        callback(err, filtered);
      };

      if (projectName) {
        ProjectCommand.chooseProjectPrompt(
          projects, projectName, function (err, selected) {
            if (err) return Errors.handlePromptError(err, cb);
            return listProjects([selected], cb);
          });
      } else {
        return listProjects(projects, cb);
      }
    });
};

servo.restart = function (servoId, cb) {
  function restartServo(restartServoId, callback) {
    ServoController.restart(restartServoId, function (err) {
      if (err) {
        err = Errors.handleApiError(err, 'RESTART_SERVO', callback);
        if (err.length > 0) return cb(err);
      }

      if (!err) Modulus.io.success(servoId + ' restarted.');

      callback(err);
    });
  }

  if (servoId) {
    ServoController.find(servoId, function (err, servoItem) {
      if (err || !servoItem) {
        return cb('Servo not found. Please specify a valid servo ID.');
      }
    });

    return restartServo(servoId, cb);
  }

  servo.list(function (err, filtered) {
    var promptOptions;

    if (err) return Errors.handlePromptError(err, cb);

    promptOptions = {
      name: 'servo',
      description: 'Servo Number?',
      warning: 'Servo number has to be between 1 and ' + filtered.length,
      minimum: 1,
      maximum: filtered.length,
      type: 'number',
      required: true
    };

    Modulus.io.prompt.get(promptOptions, function (err, answer) {
      if (err) return Errors.handlePromptError(err, cb);

      return restartServo(filtered[answer.servo - 1], cb);
    });
  });
};

module.exports = servo;
