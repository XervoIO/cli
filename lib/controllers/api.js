var librarian = require('../librarian/librarian').init('xammr.com', 5000),
    UserConfig = require('./userConfig');

module.exports = {
  librarian : librarian,
  userConfig : new UserConfig()
};