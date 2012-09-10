var librarian = require('librarian').init('localhost', 8888),
    UserConfig = require('./userConfig');

module.exports = {
  librarian : librarian,
  userConfig : new UserConfig()
};