/**
 * Description - Verifies that package.json does not contain a fatal error.
 * @param {string} projectName - name of project to verify
 * @param {string} dir - directory that contains project to be verified
 * @param {function} done - callback to be invoked with error
 **/

var fs = require('fs');

module.exports = function (packagePath, done) {
  if (!packagePath) return done();
  
  var metaPath = findFileSync((packagePath || process.cwd()), 'package.json', ['.git', 'node_modules']);
  var blackList = [{word: 'forever', level: 'FATAL'}, {word: 'pm2', level: 'FATAL'}];
  var meta;
  try {
    meta = JSON.parse(fs.readFileSync(metaPath), 'utf8');
  } catch (e) {
    return done();
  }
  
  var matches = [];
  blackList.forEach(function(elem) {
    if(meta.scripts.start.match(new RegExp(elem.word, 'g'))) {
      matches.push(elem);
    }
  });
  
  return done(null, matches);
}
