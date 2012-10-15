var librarian = require('../common/api').librarian,
    userConfig = require('../common/api').userConfig;

var User = function() {

};

User.prototype.get = function(userId, callback) {
  librarian.user.get(userId, userConfig.data.apiKey, callback);
};

User.prototype.create = function(username, email, password, callback) {
  var hashPass = librarian.util.createHash(password);
  librarian.user.create({
    username : username,
    email : email,
    password : hashPass
  }, callback);
};

User.prototype.authenticate = function(login, password, callback) {
  var hashPass = librarian.util.createHash(password);
  librarian.user.authenticate(login, hashPass, callback);
};

User.prototype.unlock = function(userId, betaKey, callback) {
  librarian.user.unlock(userId, betaKey, userConfig.data.apiKey, callback);
};

User.prototype.resetPassword = function(email, callback) {
  librarian.user.resetPassword(email, callback);
};

module.exports = new User();