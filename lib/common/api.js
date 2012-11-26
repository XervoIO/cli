var librarian = require('../librarian/librarian').init('staging.onmodulus.com', 8888, false),
    UserConfig = require('./userConfig');

module.exports = {
  librarian : librarian,
  userConfig : new UserConfig()
};