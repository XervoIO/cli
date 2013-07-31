var HTTP = function(host, port, ssl) {
  this._ssl = ssl;
  if(this._ssl) {
    this._corehttp = require('https');
  } else {
    this._corehttp = require('http');
  }
  this._host = host;
  this._port = port;

  this._corehttp.globalAgent.maxSockets = Number.MAX_VALUE;
};

// Passes the raw request and response streams to the projectController
HTTP.prototype.raw = function(path, method, data, callback) {

  if(typeof data === 'function') {
    callback = data;
    data = null;
  }

  var headers = null;
  if(data) {
    data = JSON.stringify(data);
    headers = {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    };
  }

  var options = {
    host: this._host,
    port: this._port,
    path: path,
    method: method
  };

  var req = this._corehttp.request(options, function(res){
    callback(null, req, res);
  });

  req.on('error', function(err){
    console.log(err);
    callback(err, req, null);
  });

  if(data) {
    req.write(data);
  }
  req.end();
};

HTTP.prototype.request = function(path, method, data, callback) {

  // Data is optional.  If the parameter is a function, assume it's the callback.
  if(typeof data === 'function') {
    callback = data;
    data = null;
  }

  // Convert the incoming data to JSON.
  var headers = null;
  if(data) {
    data = JSON.stringify(data);
    headers = {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    };
  }

  var options = {
    host: this._host,
    port: this._port,
    path: path,
    method: method
  };

  //This option is used in Node >= 0.10.x
  //Needed to prevent SSL confirmation errors
  //It will be ignored in older versions
  if(this._ssl) {
    options.rejectUnauthorized = false;
  }

  if(headers) {
    options.headers = headers;
  }

  var req = this._corehttp.request(options, function(res) {
    res.setEncoding('utf-8');
    res.body = '';
    res.on('data', function(data) {
      res.body += data;
    });

    res.on('end', function() {
      var result = null;

      try {
        result = JSON.parse(res.body);
      }
      catch(e) {
        return callback('Unexpected result.');
      }

      if(result === null) {
        callback(null, null);
      } else if(result.error || result.errors) {
        callback(result);
      } else {
        callback(null, result);
      }
    });
  });

  req.on('error', function(e) {
    callback(e);
  });

  if(data) {
    req.write(data);
  }

  req.end();
};

//Forwards a raw HTTP request.
HTTP.prototype.forward = function(path, req, callback) {

  //Get the timeout
  var timeout = null;
  if(req.headers.timeout) {
    timeout = req.headers.timeout;
    delete req.headers.timeout;

    req.connection.setTimeout(timeout + 200);
    console.log('Timeout = ' + timeout + 'ms');
  }

  //Setup the request options, copying the headers and method
  //from the provided request.
  var options = {
    host: this._host,
    port: this._port,
    method: req.method,
    path: path,
    headers: req.headers
  };

  var request = this._corehttp.request(options, function(response) {
    response.setEncoding('utf-8');
    response.body = '';

    response.on('data', function(data) {
      response.body += data;
    });

    response.on('end', function() {
      var result = null;

      try {
        if(response.body.length > 0) {
          result = JSON.parse(response.body);
        }
      } catch(e) {
        result = {error : 'JSON parse error : ' + e.message};
      }

      if(result !== null) {
        callback(result);
      }
      else {
        callback(null, result);
      }
    });
  });

  req.on('error', function(e) {
    callback({error : e.message});
  });

  request.on('error', function(e) {
    callback({error : e.message});
  });

  //copy any request data to the forwarded request
  req.on('data', function(data) {
    request.write(data);
  });

  //If a timeout was given, set up both request timeouts
  if(timeout !== null && typeof timeout === 'number') {
    //We always want the forward request to timeout first
    //So we add a little extra time to the main timeout

    request.on('socket', function (socket) {
      socket.setTimeout(timeout, function() {
        socket.destroy();
        req.socket.destroy();
      });
    });
  }

  request.end();
};

module.exports = HTTP;