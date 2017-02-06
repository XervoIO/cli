var createTable = require('text-table')

var xervo = require('../xervo')
var projectCommand = require('./project')
var projectController = require('../controllers/project')
var servoController = require('../controllers/servo')

var userConfig = require('../common/api').userConfig
var error = require('../common/error')

var servo = {}

servo.list = function (projectName, cb) {
  if (typeof projectName === 'function') {
    cb = projectName
    projectName = null
  }

  projectController.find({
    userId: userConfig.data.userId
  },
    function (err, projects) {
      if (err) {
        err = error.handleApiError(err, 'GET_PROJECTS', cb)
        if (err.length > 0) return cb(err)
      }

      if (projects.length === 0) {
        xervo.io.error('You currently have no projects. One can be created using the create command.')
        return cb()
      }

      var listProjects = function (projects, cb) {
        var table = []
        var filtered = []
        var count = 0

        projects.forEach(function (project) {
          table.push(['  ' + project.name.data + (' (' + project.status + ')').main])

          if (project.status === 'RUNNING') {
            project.pus.forEach(function (pu) {
              table.push(['    ' + (count + 1) + ') ' + pu.id])
              filtered[count++] = pu.id
            })
          } else {
            table.push(['    No servos.'])
          }
        })

        xervo.io.print(createTable(table))
        cb(err, filtered)
      }

      if (projectName) {
        // eslint-disable-next-line handle-callback-err
        projectCommand.chooseProjectPrompt(projects, projectName, function (err, selected) {
          return listProjects([selected], cb)
        })
      } else {
        return listProjects(projects, cb)
      }
    })
}

servo.restart = function (servoId, cb) {
  function restartServo (servoId, cb) {
    servoController.restart(servoId, function (err) {
      if (err) {
        err = error.handleApiError(err, 'RESTART_SERVO', cb)
        if (err.length > 0) return cb(err)
      }

      if (!err) xervo.io.success(servoId + ' restarted.')

      cb(err)
    })
  }

  if (servoId) {
    servoController.find(servoId, function (err, servo) {
      if (err || !servo) return cb('Servo not found. Please specify a valid servo ID.')
    })

    return restartServo(servoId, cb)
  }

  // eslint-disable-next-line handle-callback-err
  servo.list(function (err, filtered) {
    var promptOptions = {
      name: 'servo',
      description: 'Servo Number?',
      warning: 'Servo number has to be between 1 and ' + filtered.length,
      minimum: 1,
      maximum: filtered.length,
      type: 'number',
      required: true
    }

    xervo.io.prompt.get(promptOptions, function (err, answer) {
      if (err) return error.handlePromptError(err, cb)

      return restartServo(filtered[answer.servo - 1], cb)
    })
  })
}

module.exports = servo
