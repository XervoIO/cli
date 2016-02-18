const FS = require('fs');
const Util = require('util');
const Async = require('async');
const FindFileSync = require('find-file-sync');

function checkStartScript(meta, done) {
  var fatalBlackList = ['forever', 'pm2', 'nodemon'];
  var matches = [];

  if (!meta.scripts || !meta.scripts.start) return done(null, matches);

  fatalBlackList.forEach(function (check) {
    if (meta.scripts.start.match(new RegExp(check, 'g'))) {
      matches.push({
        level: 'FATAL',
        message: Util.format([
          'Your application is currently configured to run using %s,',
          'which is not supported on Modulus. Please change your start script',
          'to simply start the application and we\'ll handle the rest.\n'
        ].join('\n'), check.red)
      });
    }
  });

  done(null, matches);
}

function checkDependencies(meta, done) {
  var matches = [];
  var dependencies = meta.dependencies;

  if (!meta.dependencies) return done(null, matches);

  Object.keys(dependencies).forEach(function (dep) {
    if (dependencies[dep] === '*') {
      matches.push({
        level: 'WARN',
        message: Util.format([
          'The dependency %s is configured with the version %s, which may',
          'cause issues if the module is updated with breaking changes. You',
          'should change this to a more specific version.\n'
        ].join('\n'), dep.red, '"*"'.red)
      });
    }
  });

  done(null, matches);
}

module.exports = function (packagePath, done) {
  var metaPath;
  var meta;

  if (!packagePath) return done(null);

  metaPath = FindFileSync(
    packagePath, 'package.json', ['.git', 'node_modules']
  );

  try {
    meta = JSON.parse(FS.readFileSync(metaPath), 'utf8');// eslint-disable-line no-sync
  } catch (e) {
    return done(null);
  }

  Async.series([
    function (next) {
      checkDependencies(meta, next);
    },
    function (next) {
      checkStartScript(meta, next);
    }
  ],
  function (err, results) {
    done(err, results[0].concat(results[1]));
  });
};
