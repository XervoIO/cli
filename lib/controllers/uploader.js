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
Uploader.prototype.upload = function(projectId, file, options) {

  var self = this;

  self.uploading = true;

  var endpoint = util.format('%s://%s:%s/project/deploy/%s?authToken=%s&forceNpmInstall=%s&registry=%s',
    librarian._http._ssl ? 'https' : 'http',
    librarian._http._host,
    librarian._http._port,
    projectId,
    userConfig.data.apiKey,
    options.forceNpmInstall,
    options.registry);

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

          //convert the response to an object
          if(typeof b === 'string') {
            try {
              var tmp = JSON.parse(b);
              b = tmp;
            } catch(e) {
              //console out the response body for debugging
              console.log('Unknown body type.');
              console.log(b);
            }
          }

          //check for errors
          if(typeof b === 'object') {
            if(b.error) {
              console.log(b.error);
              return (self.emit('error', 'There was an error uploading.'));
            } else if(b.errors) {
              return self.emit('error', b.errors[0].message);
            }
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
