var scribe_util = require('./util'),
            util = require('util'),
               _ = require('underscore'),
            http = require('./http');

var scribe = {};
scribe.project = {};
scribe._http = null;

scribe.init = function(host, port, ssl) {
  if(!ssl) {
    ssl = false;
  }
  scribe._http = new http(host, port, ssl);
  return this;
};


//-----------------------------------------------------------------------------
scribe.project.downloadLogs = function(projectId, authToken, callback){
  if(checkInit(callback)) {
    scribe._http.raw(util.format('/project/%s/logs/download?authToken=%s', projectId, authToken), 'GET', callback);
  }
};

//-----------------------------------------------------------------------------
scribe.project.streamLogs = function(projectId, authToken, callback){
  if(checkInit(callback)){
    scribe._http.raw(util.format('/project/%s/logs/stream?authToken=%s', projectId, authToken), 'GET', callback);
  }
};

//-----------------------------------------------------------------------------
var checkInit = function(callback) {
  if(scribe._http === null) {
    callback({ error: 'scribe API is not initialized.  Call init().' });
    return false;
  }
  return true;
};

module.exports = scribe;