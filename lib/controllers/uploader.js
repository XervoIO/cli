var librarian = require('../common/api').librarian
var userConfig = require('../common/api').userConfig
var fs = require('fs')
var EventEmitter = require('events').EventEmitter
var util = require('util')
var request = require('request')
var _ = require('underscore')

// -----------------------------------------------------------------------------
/**
 * Handles file uploading.
 * Events:
 * error
 * progress
 * end
 */
 // -----------------------------------------------------------------------------
var Uploader = function () {

}

util.inherits(Uploader, EventEmitter)

// -----------------------------------------------------------------------------
/**
 * Uploads a file.
 */
// -----------------------------------------------------------------------------
Uploader.prototype.upload = function (projectId, file, options) {
  var endpoint, reqOptions
  var self = this
  var apiKey = userConfig.data.apiKey

  self.uploading = true

  endpoint = util.format(
    '%s://%s:%s/project/deploy/%s',
    librarian._http._ssl ? 'https' : 'http',
    librarian._http._host,
    librarian._http._port,
    projectId
  )

  fs.stat(file, function (err, stat) {
    if (err) return self.emit('error', err)

    reqOptions = {
      method: 'PUT',
      uri: endpoint,
      timeout: 60 * 60 * 1000, // 1 hour
      qs: _.extend({ authToken: apiKey }, options),
      headers: { 'content-length': stat.size }
    }

    // Read the file and pipe the contents directly.
    fs.createReadStream(file).pipe(
      request(reqOptions, function (err, res, body) {
        self.uploading = false

        if (err) return self.emit('error', err)

        // convert the response to an object
        if (typeof body === 'string') {
          try {
            body = JSON.parse(body)
          } catch (e) {
            // console out the response body for debugging
            console.log('Unknown body type.')
            console.log(body)
          }
        }

        // check for errors
        if (typeof body === 'object') {
          if (body.error) {
            console.log(body.error)
            return (self.emit('error', 'There was an error uploading.'))
          } else if (body.errors) {
            return self.emit('error', body.errors[0].message)
          }
        }

        // Send a final progress emit so the user always sees 100%.
        self.emit('progress', 1)

        // Do next tick so the UI can actually update to 100% before
        // continuing.
        process.nextTick(function () {
          self.emit('end')
        })
      })
    )
  })

  self.monitorProgress(projectId)
}

// -----------------------------------------------------------------------------
/**
 * Periodically requests upload progress information.
 * @param {string} projectId The project ID.
 */
// -----------------------------------------------------------------------------
Uploader.prototype.monitorProgress = function (projectId) {
  var self = this

  var getStatus = function () {
    librarian.project.uploadProgress(projectId, userConfig.data.apiKey, function (err, result) {
      // If an error does occur, just ignore it and continue trying to get the progress.
      if (!err) {
        if (self.uploading) {
          self.emit('progress', result.progress)
        }
      }

      // Wait a second and get status again.
      if (self.uploading) {
        setTimeout(getStatus, 1000)
      }
    })
  }

  setTimeout(getStatus, 1000)
}

module.exports = Uploader
