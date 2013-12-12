var UserConfig = require('./userConfig'),
  url = require('url'),
  librarian = require('../librarian/librarian'),
  userConfig = new UserConfig();

userConfig.load();

if (typeof userConfig.data.api_uri !== 'undefined') {
  var url = url.parse(userConfig.data.api_uri);

  if (url.protocol === 'https:') {
    librarian.init(url.hostname, url.port || 443, true);
  } else {
    librarian.init(url.hostname, url.port || 80, false);
  }
} else {
  librarian.init('api.onmodulus.net', 443, true);
}

module.exports = {
  librarian : librarian,
  userConfig : new UserConfig()
};
