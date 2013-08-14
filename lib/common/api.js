var librarian = require('../librarian/librarian').init('api.onmodulus.net', 443, true),
    scribe = require('../scribe/scribe').init('api.onmodulus.net', 443, true),
    UserConfig = require('./userConfig');

module.exports = {
  librarian : librarian,
  scribe : scribe,
  userConfig : new UserConfig()
};