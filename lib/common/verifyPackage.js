/**
 * Description - Verifies that package.json does not contain a fatal error.
 * @param {string} packagePath - directory of the project to verify
 * @param {function} done - callback to be invoked with error
 **/

var fs           = require('fs');
var findFileSync = require('find-file-sync');
var util         = require('util');

module.exports = function (packagePath, done) {
  var matches = [];
  var metaPath;
  var meta;
  
  if (!packagePath) return done(null, matches);
  metaPath = findFileSync(packagePath, 'package.json', ['.git', 'node_modules']);
  
  try {
    meta = JSON.parse(fs.readFileSync(metaPath), 'utf8');
  } catch (e) {
    return done(null, matches);
  }

  if (!meta.scripts || !meta.scripts.start) return done(null, matches);
  
  fatalBlackList.forEach(function (elem) {
    if(meta.scripts.start.match(new RegExp(elem, 'g'))) {
      matches.push(createFatalMessage(elem));
    }
  });

  return done(null, matches);
}

var fatalBlackList = ['forever', 'pm2', 'nodemon'];

function createFatalMessage (command) {
  return util.format(['Your application is currently configured to run using %s,',
      'which is not supported on Modulus. Please change your start script',
      'to simply start the application and we\'ll handle the rest.'
    ].join('\n'), command.red);
}
