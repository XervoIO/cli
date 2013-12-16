var UserConfig = require('./userConfig'),
  url = require('url'),
  librarian = require('../librarian/librarian'),
  userConfig = new UserConfig();

userConfig.load();

if (!userConfig.data) {
  userConfig.save({ api_uri: 'https://api.onmodulus.net' });
  userConfig.load();
}

var url = url.parse(userConfig.data.api_uri);

if (url.protocol === 'https:') {
  librarian.init(url.hostname, url.port || 443, true);
} else {
  librarian.init(url.hostname, url.port || 80, false);
}

module.exports = {
  librarian : librarian,
  userConfig : new UserConfig()
};
