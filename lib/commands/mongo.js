var modulus = require('../modulus'),
    mongoController = require('../controllers/mongo'),
    async = require('async'),
    userConfig = require('../common/api').userConfig;

var mongo = {};

mongo.create = function(dbName, cb) {
  var createDatabase = function(dname) {
    mongoController.create(
      dname,
      function(err, database) {
        if(err) {
          err = error.handleApiError(err, 'CREATE_MONGO', cb);
          if(err.length > 0) {
            return cb(err);
          }
        }
        if(!project) {
          return cb('Could not create MongoDB database. Error from server.');
        }
        modulus.io.success('New MongoDB database ' + dname.data + ' created.');
        return cb();
    });
  }

  // If project name is passed do NOT prompt for name
  if(dbName && dbName !== '') {
    modulus.io.print('Creating MongoDB database ' + dbName.data);
    createDatabase(dbName);
  } else {
    mongo._createDatabasePrompt(function(err, name) {
      if(err) {
        return cb('Could not create MongoDB database.');
      }
      createDatabase(name);
    });
  }
};

//-------------------------------------------------------------------------------------------------
mongo._createDatabasePrompt = function(cb) {
  modulus.io.prompt.get([{
    name : 'name',
    description : 'Enter a database name:',
    maxLength : 50,
    required : true
  }], function(err, results) {
    if(err) {
      return error.handlePromptError(err, cb);
    }
    cb(null, results.name);
  });
};

module.exports = mongo;