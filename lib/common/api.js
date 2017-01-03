var UserConfig = require('./userConfig'),
  url = require('url'),
  librarian = require('../librarian/librarian'),
  userConfig = new UserConfig();

userConfig.load();

if (userConfig.data && userConfig.data.api_uri) {
  var url = url.parse(userConfig.data.api_uri);

  if (url.protocol === 'https:') {
    librarian.init(url.hostname, url.port || 443, true);
  } else {
    librarian.init(url.hostname, url.port || 80, false);
  }
} else {
  librarian.init('api.xervo.io', 443, true);
}

module.exports = {
  librarian : librarian,
  userConfig : new UserConfig()
};
