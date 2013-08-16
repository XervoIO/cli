var librarian = require('../common/api').librarian,
    userConfig = require('../common/api').userConfig,
    fs = require('fs'),
    EventEmitter = require('events').EventEmitter,
    util = require('util'),
    request = require('request');

//-----------------------------------------------------------------------------
/**
 * Handles file uploading.
 * Events:
 * error
 * progress
 * end
 */
 //-----------------------------------------------------------------------------
var Uploader = function() {

};

util.inherits(Uploader, EventEmitter);

//-----------------------------------------------------------------------------
/**
 * Uploads a file.
 */
//-----------------------------------------------------------------------------
Uploader.prototype.upload = function(projectId, file) {

  var self = this;

  self.uploading = true;

  var endpoint = util.format('%s://%s:%s/project/deploy/%s?authToken=%s',
    librarian._http._ssl ? 'https' : 'http',
    librarian._http._host,
    librarian._http._port,
    projectId,
    userConfig.data.apiKey);

  fs.stat(file, function(err, stat) {

    if(err) {
      return self.emit('error', err);
    }

    // Read the file and pipe the contents directly.
    fs.createReadStream(file).pipe(
      request.put(
        {
          method: 'PUT',
          uri : endpoint,
          timeout: 60 * 60 * 1000, // 1 hour
          headers : {
            'content-length' : stat.size
          }
        },
        function(err, res, b) {

          self.uploading = false;

          if(err) {
            return self.emit('error', err);
          }

          // Send a final progress emit so the user always sees 100%.
          self.emit('progress', 1);

          // Do next tick so the UI can actually update to 100% before
          // continuing.
          process.nextTick(function() {
            self.emit('end');  
          });
        }
      )
    );
  });

  self.monitorProgress(projectId);
};

//-----------------------------------------------------------------------------
/**
 * Periodically requests upload progress information.
 * @param {string} projectId The project ID.
 */
//-----------------------------------------------------------------------------
Uploader.prototype.monitorProgress = function(projectId) {

  var self = this;

  var getStatus = function() {
    librarian.project.uploadProgress(projectId, userConfig.data.apiKey, function(err, result) {

      // If an error does occur, just ignore it and continue trying to get the progress.
      if(!err) {
        if(self.uploading) {
          self.emit('progress', result.progress);
        }
      }

      // Wait a second and get status again.
      if(self.uploading) {
        setTimeout(getStatus, 1000);
      }
    });
  };

  setTimeout(getStatus, 1000);
};

module.exports = Uploader;