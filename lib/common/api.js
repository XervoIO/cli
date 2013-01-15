var librarian = require('../librarian/librarian').init('api.onmodulus.net', 80, false),
    UserConfig = require('./userConfig');

module.exports = {
  librarian : librarian,
  userConfig : new UserConfig()
};