var librarian = require('../librarian/librarian').init('api.onmodulus.net', 443, true),
    UserConfig = require('./userConfig');

module.exports = {
  librarian : librarian,
  userConfig : new UserConfig()
};