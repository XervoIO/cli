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
const EventEmitter = require('events').EventEmitter;
const Util = require('util');
const Request = require('request');
const Logger = require('@modulus/logger')('CLI');

const Librarian = require('../common/api').librarian;
const UserConfig = require('../common/api').userConfig;

const HOUR = 3600000; // 60 * 60 * 1000
const TIMEOUT = 1000;
// ----------------------------------------------------------------------------
/**
 * Handles file uploading.
 * Events:
 * error
 * progress
 * end
 */
 // ---------------------------------------------------------------------------
var Uploader = function () {

};

Util.inherits(Uploader, EventEmitter);

// ----------------------------------------------------------------------------
/**
 * Uploads a file.
 */
// ----------------------------------------------------------------------------
Uploader.prototype.upload = function (projectId, file, options) {
  var endpoint, self = this;
  self.uploading = true;

  endpoint = Util.format(
    '%s://%s:%s/project/deploy/%s?authToken=%s&forceNpmInstall=%s&registry=%s&withTests=%s',
    Librarian._http._ssl ? 'https' : 'http',
    Librarian._http._host,
    Librarian._http._port,
    projectId,
    UserConfig.data.apiKey,
    options.forceNpmInstall,
    options.registry,
    options.withTests
  );

  FS.stat(file, function (err, stat) {
    if (err) return self.emit('error', err);

    // Read the file and pipe the contents directly.
    FS.createReadStream(file).pipe(
      Request.put(
        {
          method: 'PUT',
          uri: endpoint,
          timeout: HOUR,
          headers: { 'content-length': stat.size }
        },
        function (err, res, b) {
          var tmp;
          self.uploading = false;

          if (err) return self.emit('error', err);
          // convert the response to an object
          if (typeof b === 'string') {
            try {
              tmp = JSON.parse(b);
              b = tmp;
            } catch (e) {
              // console out the response body for debugging
              Logger.debug('Unknown body type.');
              Logger.debug(b);
            }
          }

          // check for errors
          if (typeof b === 'object') {
            if (b.error) {
              Logger.debug(b.error);
              return self.emit('error', 'There was an error uploading.');
            } else if (b.errors) {
              return self.emit('error', b.errors[0].message);
            }
          }

          // Send a final progress emit so the user always sees 100%.
          self.emit('progress', 1);

          // Do next tick so the UI can actually update to 100% before
          // continuing.
          process.nextTick(function () {
            self.emit('end');
          });
        }
      )
    );
  });

  self.monitorProgress(projectId);
};

// ----------------------------------------------------------------------------
/**
 * Periodically requests upload progress information.
 * @param {string} projectId The project ID.
 */
// ----------------------------------------------------------------------------
Uploader.prototype.monitorProgress = function (projectId) {
  var self = this;
  var getStatus = function () {
    Librarian.project.uploadProgress(
      projectId, UserConfig.data.apiKey, function (err, result) {
        // If error, just ignore it and continue trying to get the progress.
        if (!err) {
          if (self.uploading) self.emit('progress', result.progress);
        }

        // Wait a second and get status again.
        if (self.uploading) setTimeout(getStatus, TIMEOUT);
      });
  };

  setTimeout(getStatus, TIMEOUT);
};

module.exports = Uploader;
/* eslint-enable no-underscore-dangle */
