//test all versions of node

var fs =  require('fs')
  , util = require('util');

var exec = require('child_process').exec, child, json, cmd, versions = [];

exec('nave ls-remote', function(err, stdout) {
  stdout && stdout.split('\n').forEach(function(seg) {
    return seg === '' || seg === 'remote:' ? void 0 : seg.spilt('\t').forEach(function(ver) {
      ver ===  '' || versions.push(ver);
    });
  });
  
  versions.forEach(function(version) {
    cmd = util.format('nave use %s node testApp/index.js', version);
    exec(cmd, function(err, stdout) {
      json = JSON.parse(fs.readFileSync('testApp/package.json', 'utf8'));
      console.log('version:\n', version);
      var currentVersion = json.version;
      json.version = version;
      fs.writeFileSync('testApp/package.json', JSON.stringify(json), 'utf8') 
      var newVersion = json.version;
        if (version == newVersion) {
          console.log('version was updated and correct');
        } else { 
          console.log('error version was not placed into json'); 
        }
    });
  });

});
