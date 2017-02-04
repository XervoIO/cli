var request = require('request')
var createTable = require('text-table')

var xervo = require('../xervo')
var url = 'http://status.progress.com/api/v2/summary.json'

var Status = {}
var STACK = [
  'Web Interface', 'API', 'MongoDB', 'Balancers',
  'Stats', 'Application Hosts', 'Build Hosts', 'Support'
]

Status.get = function (callback) {
  request.get({
    url: url,
    json: true
  },
  function (err, response, body) {
    var table = []

    if (err) return callback(err)
    if (!body.components || !body.components.length) return callback('Status not available')

    body.components.forEach(function (component) {
      if (STACK.indexOf(component.name) === -1) return

      if (component.status === 'operational') {
        table.push([
          component.name.grey + ': '.grey,
          component.status.replace('_', ' ').green
        ])
      } else {
        table.push([
          component.name.grey + ': '.grey,
          component.status.replace('_', ' ').red
        ])
      }
    })

    xervo.io.print('--------------------------------------------------')
    xervo.io.print('Current Status'.grey)
    xervo.io.print('--------------------------------------------------')
    xervo.io.print(createTable(table))
    xervo.io.print('--------------------------------------------------')
    xervo.io.print('View full details at ' + 'https://status.progress.com'.blue)
    xervo.io.print('--------------------------------------------------')
    callback()
  })
}

module.exports = Status
