var fs = require('fs');

var UserConfig = function() {
  this.dir = getUserHome() + '/.modulus/';
  if(!fs.existsSync(this.dir)) {
    fs.mkdirSync(this.dir);
  }
};

UserConfig.prototype.load = function() {
  var configFile = this.dir + 'current-modc.json';
  if(fs.existsSync(configFile)) {
    try {
      this.data = JSON.parse(fs.readFileSync(configFile));
    } catch(e) {
      this.data = null;
    }
    return true;
  } else {
    return false;
  }
};

UserConfig.prototype.save = function(data) {
  var configFile = this.dir + 'current-modc.json';
  fs.writeFileSync(configFile, JSON.stringify(data));
  return true;
};

UserConfig.prototype.clear = function() {
  var configFile = this.dir + 'current-modc.json';
  fs.writeFileSync(configFile, '');
  return true;
};

function getUserHome() {
  return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}

module.exports = UserConfig;