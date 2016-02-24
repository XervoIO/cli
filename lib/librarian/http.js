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
const Http = require('http');
const Https = require('https');
const ADD_TIMEOUT = 200;

var HTTP = function (host, port, ssl) {
  this._ssl = ssl;
  if (this._ssl) this._corehttp = Https;
  else this._corehttp = Http;
  this._host = host;
  this._port = port;

  this._corehttp.globalAgent.maxSockets = Number.MAX_VALUE;
};

// Passes the raw request and response streams to the projectController
HTTP.prototype.raw = function (path, method, data, callback) {
  var req, options;
  if (typeof data === 'function') {
    callback = data;
    data = null;
  }

  if (data) data = JSON.stringify(data);

  // TODO: add headers info to options (type & length)
  options = {
    host: this._host,
    port: this._port,
    path: path,
    method: method
  };

  req = this._corehttp.request(options, function (res) {
    callback(null, req, res);
  });

  req.on('error', function (err) {
    callback(err, req);
  });

  if (data) req.write(data);
  req.end();
};

HTTP.prototype.request = function (path, method, data, callback) {
  var req, options, headers;
  // Data is optional. If parameter is a function, assume it's the callback.
  if (typeof data === 'function') {
    callback = data;
    data = null;
  }

  // Convert the incoming data to JSON.
  if (data) {
    data = JSON.stringify(data);
    headers = {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    };
  }

  options = {
    host: this._host,
    port: this._port,
    path: path,
    method: method
  };

  // This option is used in Node >= 0.10.x
  // Needed to prevent SSL confirmation errors
  // It will be ignored in older versions
  if (this._ssl) options.rejectUnauthorized = false;
  if (headers) options.headers = headers;

  req = this._corehttp.request(options, function (res) {
    res.setEncoding('utf-8');
    res.body = '';
    res.on('data', function (receivedData) {
      res.body += receivedData;
    });

    res.on('end', function () {
      var result = null;

      try {
        result = JSON.parse(res.body);
      } catch (e) {
        return callback('Unexpected result.');
      }

      if (result === null) return callback(null, null);
      if (result.error || result.errors) return callback(result);
      return callback(null, result);
    });
  });

  req.on('error', function (e) {
    callback(e);
  });

  if (data) req.write(data);
  req.end();
};

// Forwards a raw HTTP request.
HTTP.prototype.forward = function (path, req, callback) {
  var request, options, timeout = null;
  // Get the timeout
  if (req.headers.timeout) {
    timeout = req.headers.timeout;
    delete req.headers.timeout;

    req.connection.setTimeout(timeout + ADD_TIMEOUT);
  }

  // Setup the request options, copying the headers and method
  // from the provided request.
  options = {
    host: this._host,
    port: this._port,
    method: req.method,
    path: path,
    headers: req.headers
  };

  request = this._corehttp.request(options, function (response) {
    response.setEncoding('utf-8');
    response.body = '';

    response.on('data', function (data) {
      response.body += data;
    });

    response.on('end', function () {
      var result = null;

      try {
        if (response.body.length > 0) result = JSON.parse(response.body);
      } catch (e) {
        result = { error: 'JSON parse error : ' + e.message };
      }

      if (result === null) return callback(null, result);
      return callback(result);
    });
  });

  req.on('error', function (e) {
    callback({ error: e.message });
  });

  request.on('error', function (e) {
    callback({ error: e.message });
  });

  // copy any request data to the forwarded request
  req.on('data', function (data) {
    request.write(data);
  });

  // If a timeout was given, set up both request timeouts
  if (timeout !== null && typeof timeout === 'number') {
    // We always want the forward request to timeout first
    // So we add a little extra time to the main timeout

    request.on('socket', function (socket) {
      socket.setTimeout(timeout, function () {
        socket.destroy();
        req.socket.destroy();
      });
    });
  }

  request.end();
};

module.exports = HTTP;
/* eslint-enable no-underscore-dangle */
