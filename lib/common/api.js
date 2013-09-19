var librarian = require('../librarian/librarian').init('xammr.com', 8282, false),
    UserConfig = require('./userConfig');

module.exports = {
  librarian : librarian,
  userConfig : new UserConfig()
};