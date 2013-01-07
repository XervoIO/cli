var librarian = require('../librarian/librarian').init('xammr.com', 8888),
    UserConfig = require('./userConfig');

module.exports = {
  librarian : librarian,
  userConfig : new UserConfig()
};