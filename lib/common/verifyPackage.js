/**
 * Description - Verifies that package.json does not contain a fatal error.
 * @param {string} packagePath - directory of the project to verify
 * @param {function} done - callback to be invoked with error
 **/

var fs           = require('fs');
var findFileSync = require('find-file-sync');
var util         = require('util');

module.exports = function (packagePath, done) {
  if (!packagePath) return done();
  
  var metaPath = findFileSync((packagePath), 'package.json', ['.git', 'node_modules']);
  var meta;
  try {
    meta = JSON.parse(fs.readFileSync(metaPath), 'utf8');
  } catch (e) {
    return done();
  }
  
  var matches = [];
  fatalBlackList.forEach(function(elem) {
    try {
      // if there isn't a start script try will fail
      if(meta.scripts.start.match(new RegExp(elem, 'g'))) {
        matches.push(createFatalMessage(elem));
      }
    } catch (e) {
      // no start script, exit loop and return no need to check all blacklisted modules
    }
  });
  
  return done(null, matches);
}

var fatalBlackList = ['forever', 'pm2', 'nodemon'];

function createFatalMessage (command) {
  return util.format(['FATAL: Your application is currently configured to run using %s,',
      'which is not supported on Modulus. Please change your start',
      'script to simply start the application and we\'ll handle the rest.'
    ].join(' '), command);
}
