//test all versions of node

var fs =  require('fs')
  , util = require('util')
  , http = require('http')
  , request = require('request')
  , path = require('path');

var exec = require('child_process').exec, json, = [];
var async = require('async');
var versions = [];
var index = -1;

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

        // Request the project and verify version.
        function(callback) {
          checkVersion(versions[index], callback);
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
  fs.writeFileSync('testApp/package.json', JSON.stringify(json), 'utf8');
  callback();
};

//-----------------------------------------------------------------------------
var deploy = function(callback) {
  var dir = path.resolve(__dirname, 'testApp')
    , run = path.resolve(__dirname, '..', '..', 'lib') + '\\modulus.js';
  console.log(dir);
  exec(util.format('modulus project deploy C:\\Users\\Erin\\fulcrum\\test\\versiontest\\testApp -p "versiontest"', run, dir), function(err, stdout, stderr){
  console.log(stdout);
       callback();
  });

};

//-----------------------------------------------------------------------------
var checkVersion = function(version, callback) {
  console.log('waiting for response\n');
 var data = '';
//http://testversion-7791.onmodulus.net/'
http.get('http://versiontest-100017.xammr.com/', function(res) {
  res.on('data', function(chunk) {
    data += chunk;
  });
  res.on('end', function() {
    version = 'v'+version;
       if(data !== version) {
      return callback('Versions do not match. Expected: ' + version + ' actual: ' + data);
    } else{
      console.log('versions matched!')
      callback();
    }
  });
});
  //callback();
};

//-----------------------------------------------------------------------------
var go = function() {

  // Get all versions of node.
  versions = [
  '0.6.0'
  , '0.6.1'
  , '0.6.2'
  , '0.6.3'
  , '0.6.4'
  , '0.6.5'
  , '0.6.6'
  , '0.6.7'
  , '0.6.8'
  , '0.6.9'
  , '0.6.10'
  , '0.6.11'
  , '0.6.12'
  , '0.6.13'
  , '0.6.14'
  , '0.6.15'
  , '0.6.16'
  , '0.6.17'
  , '0.6.18'
  , '0.6.19'
  , '0.6.20'
  , '0.6.21'
  , '0.7.0'
  , '0.7.1'
  , '0.7.2'
  , '0.7.3'
  , '0.7.4'
  , '0.7.5'
  , '0.7.6'
  , '0.7.7'
  , '0.7.8'
  , '0.7.9'
  , '0.7.10'
  , '0.7.11'
  , '0.7.12'
  , '0.8.0'
  , '0.8.1'
  , '0.8.2'
  , '0.8.3'
  , '0.8.4'
  , '0.8.5'
  , '0.8.6'
  , '0.8.7'
  , '0.8.8'
  , '0.8.9'
  , '0.8.10'
  , '0.8.11'
  , '0.8.12'
  , '0.8.13'
  , '0.8.14'
  , '0.8.15'
  , '0.8.16'
  , '0.8.17'
  , '0.8.18'
  , '0.8.19'
  , '0.8.20'
  , '0.8.21'
  , '0.8.22'
  , '0.8.23'
  , '0.9.0'
  , '0.9.1'
  , '0.9.2'
  , '0.9.3'
  , '0.9.4'
  , '0.9.5'
  , '0.9.6'
  , '0.9.7'
  , '0.9.8'
  , '0.9.10'
  , '0.9.12'
  , '0.10.0'
  , '0.10.1'
  , '0.10.2'
  , '0.10.3'
  , '0.10.4'
  , '0.10.5'
  , '0.10.6'
  , '0.10.7'
  , '0.11.0'
  , '0.11.1'
  , '0.11.2'
  ];

  // Use nave, or just hard-code them here, whatever.

  // When done, call run();
  run();
};

// Kick it off.
go();

