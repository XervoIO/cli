/**
 * Description - Verifies that package.json does not contain a fatal error.
 * @param {string} projectName - name of project to verify
 * @param {string} dir - directory that contains project to be verified
 * @param {function} done - callback to be invoked with error
 **/

var fs = require('fs');
var findFileSync = require('find-file-sync');

module.exports = function (packagePath, done) {
  if (!packagePath) return done();
  
  var metaPath = findFileSync((packagePath || process.cwd()), 'package.json', ['.git', 'node_modules']);
  var meta;
  try {
    meta = JSON.parse(fs.readFileSync(metaPath), 'utf8');
  } catch (e) {
    return done();
  }
  
  var matches = [];
  blackList.forEach(function(elem) {
    try {
      if(meta.scripts.start.match(new RegExp(elem.command, 'g'))) {
        matches.push(elem);
      }
    } catch (e) {
      // there's nothing wrong here, just no start scripts
    }
  });
  
  return done(null, matches);
}

var blackList = [
  {
    command: 'forever', 
    level: 'FATAL', 
    message: [
      'Your application is currently configured to run using forever,',
      'which is not supported on Modulus. Please change your start script', 
      'to simply start the application and we\'ll handle the rest.'
    ].join(' ')
  },
  {
    command: 'pm2', 
    level: 'FATAL', 
    message: [
      'Your application is currently configured to run using pm2,',
      'which is not supported on Modulus. Please change your start',
      'script to simply start the application and we\'ll handle the rest.'
    ].join(' ')
  }
];