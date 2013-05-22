//test all versions of node

var fs =  require('fs')
  , util = require('util')
  , http = require('http')
  , request = require('request')
  , path = require('path');

var options = {
  host: 'http://testversion-7791.onmodulus.net/',
  method: 'GET'
};

var exec = require('child_process').exec, child, json, cmd, versions = [];
var async = require('async'); // https://github.com/caolan/async

var versions = [];

var index = -1;

//-----------------------------------------------------------------------------
var run = function() {

  // https://github.com/caolan/async/#whilsttest-fn-callback
  async.whilst(
    function() {
      index++;
      // Keep going until we've done every entry in the array.
      return index <= versions.length;
    },
    function(callback) {

      // https://github.com/caolan/async/#seriestasks-callback
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
  // Update test-app/package.json with supplied version.
  json = JSON.parse(fs.readFileSync('testApp/package.json', 'utf8'));
  console.log('version node:\n', json.engines.node);
  console.log('need to change version to: ', version);
  json.engines.node = version;
  //console.log('json.engines.node = ', JSON.stringify(json.version));
  fs.writeFileSync('testApp/package.json', JSON.stringify(json), 'utf8');
  console.log('json : \n', json);
  // When done, invoke callback.
  callback();
};

//-----------------------------------------------------------------------------
var deploy = function(callback) {
  // Use expect script to control modulus CLI.
  // Invoke modulus deploy test-app
  var dir = path.resolve(__dirname, 'testApp')
    , run = path.resolve(__dirname, '..', '..', 'lib') + '\\modulus.js';
  console.log(dir);
  //node %s project deploy %s -p "versiontest"
  exec(util.format('modulus project deploy C:\\Users\\Erin\\fulcrum\\test\\versiontest\\testApp -p "versiontest"', run, dir), function(err, stdout){
  console.log('json after deploy: \n', JSON.parse(fs.readFileSync('testApp/package.json', 'utf8')));
  console.log(stdout);
    // When deploy is done, invoke callback
    setTimeout(function() {
       callback();
    }, 15000);
  });

};

//-----------------------------------------------------------------------------
var checkVersion = function(version, callback) {
  // Every modulus project has a unique url. [something].onmodulus.net
  // When you create the project and deploy to it the first time, you'll get this url.
  // The creation/initial deploy can all be done through the web interface

  // https://github.com/mikeal/request
  // Use the request module to make a web request to the modulus test app.
  // The app should simply return process.version it it's response.
  console.log('waiting for response\n');
   // TODO: comes from deployed test app.
 var data = '';
//http://testversion-7791.onmodulus.net/'
http.get('http://versiontest-100017.xammr.com/', function(res) {
  res.on('data', function(chunk) {
    data += chunk;
  });
  res.on('end', function() {
    console.log('version:', data);
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
  versions = ['0.8.7', '0.8.9']; // Use nave, or just hard-code them here, whatever.

  // When done, call run();
  run();
};

// Kick it off.
go();

