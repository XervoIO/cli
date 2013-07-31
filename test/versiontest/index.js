/**
 * Iterates through a large collection of Node versions, sets the
 * engine to each one, deploys, and verifies the output.
 */

var fs =  require('fs')
  , util = require('util')
  , http = require('http')
  , https = require('https')
  , request = require('request')
  , path = require('path');

var exec = require('child_process').exec, json;
var async = require('async');
var versions = [];
var index = -1;

var token = '';
var projectUrl = 'example.onmodulus.net';
var projectId = '000';
var apiUrl = 'https://api.onmodulus.net';

//-----------------------------------------------------------------------------
var run = function() {

  async.whilst(
    function() {
      index++;
      // Keep going until we've done every entry in the array.
      return index <= versions.length-1;
    },
    function(callback) {

      async.series([

        // Update package.json file.
        function(callback) {
          updatePackageJSON(versions[index], callback);
        },

        // Deploy the updated project.
        function(callback) {
          deploy(callback);
        },

        // Print the logs, incase an error occurred.
        function(callback) {
          getLogs(callback);
        },

        // Request the project and verify version.
        function(callback) {
          setTimeout(function() {
            checkVersion(versions[index], callback);
          }, 2000);
        }
      ], callback);
    },
    function(err) {
      if(err) {
        console.log('ERROR: ' + err);
      }
      else {
        console.log('DONE!');
      }
    }
  );
};

//-----------------------------------------------------------------------------
var updatePackageJSON = function(version, callback) {
  json = JSON.parse(fs.readFileSync('testApp/package.json', 'utf8'));
  console.log('version node:\n', json.engines.node);
  console.log('need to change version to: ', version);
  json.engines.node = version;
  json.dependencies = { semver: '* '};
  fs.writeFileSync('testApp/package.json', JSON.stringify(json), 'utf8');
  callback();
};

//-----------------------------------------------------------------------------
var deploy = function(callback) {
  console.log('Deploying...');
  exec('../../bin/modulus project deploy ./testApp -p Test', function(err, stdout, stderr){
  console.log(stdout);
       callback();
  });
};

//-----------------------------------------------------------------------------
var checkVersion = function(version, callback) {
  console.log('waiting for response\n');
 var data = '';
//http://testversion-7791.onmodulus.net/'
http.get(projectUrl, function(res) {
  res.on('data', function(chunk) {
    data += chunk;
    console.log(data);
  });
  res.on('end', function() {
    if(version === '0.6.21') {
      version = '0.6.21-pre';
    }
    version = 'v'+version;
       if(data !== version) {
      return callback('Versions do not match. Expected: ' + version + ' actual: ' + data);
    } else{
      console.log('versions matched!');
      callback();
    }
  });
});
  //callback();
};

//-----------------------------------------------------------------------------
var getLogs = function(callback) {
  var data = '';
  http.get(apiUrl + '/project/' + projectId + '/logs?authToken=' + token, function(res) {
    res.on('data', function(chunk) {
      data += chunk;
    });
    res.on('end', function() {
      console.log(data);
      callback();
    });
  });
};

//-----------------------------------------------------------------------------
var go = function() {

  // Get all versions of node.
  versions = [
  '0.2.0',
'0.2.1',
'0.2.2',
'0.2.3',
'0.2.4',
'0.2.5',
'0.2.6',
'0.3.0',
'0.3.1',
'0.3.2',
'0.3.3',
'0.3.4',
'0.3.5',
'0.3.6',
'0.3.7',
'0.3.8',
'0.4.0',
'0.4.1',
'0.4.2',
'0.4.3',
'0.4.4',
'0.4.5',
'0.4.6',
'0.4.7',
'0.4.8',
'0.4.9',
'0.4.10',
'0.4.11',
'0.4.12',
'0.5.0',
'0.5.1',
'0.5.2',
'0.5.3',
'0.5.4',
'0.5.5',
'0.5.6',
'0.5.7',
'0.5.8',
'0.5.9',
'0.5.10',
'0.6.0',
'0.6.1',
'0.6.2',
'0.6.3',
'0.6.4',
'0.6.5',
'0.6.6',
'0.6.7',
'0.6.8',
'0.6.9',
'0.6.10',
'0.6.11',
'0.6.12',
'0.6.13',
'0.6.14',
'0.6.15',
'0.6.16',
'0.6.17',
'0.6.18',
'0.6.19',
'0.6.20',
'0.6.21',
'0.7.0',
'0.7.1',
'0.7.2',
'0.7.3',
'0.7.4',
'0.7.5',
'0.7.6',
'0.7.7',
'0.7.8',
'0.7.9',
'0.7.10',
'0.7.11',
'0.7.12',
'0.8.0',
'0.8.1',
'0.8.2',
'0.8.3',
'0.8.4',
'0.8.5',
'0.8.6',
'0.8.7',
'0.8.8',
'0.8.9',
'0.8.10',
'0.8.11',
'0.8.12',
'0.8.13',
'0.8.14',
'0.8.15',
'0.8.16',
'0.8.17',
'0.8.18',
'0.8.19',
'0.8.20',
'0.8.21',
'0.8.22',
'0.8.23',
'0.9.0',
'0.9.1',
'0.9.2',
'0.9.3',
'0.9.4',
'0.9.5',
'0.9.6',
'0.9.7',
'0.9.8',
'0.9.9',
'0.9.10',
'0.9.11',
'0.9.12',
'0.10.0',
'0.10.1',
'0.10.2',
'0.10.3',
'0.10.4',
'0.10.5',
'0.10.6',
'0.10.7',
'0.10.8',
'0.10.9',
'0.10.10',
'0.11.0',
'0.11.1',
'0.11.2'
  ];

  run();
};

// Kick it off.
go();

