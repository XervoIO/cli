var modulus = require('../modulus'),
    mongoController = require('../controllers/mongo'),
    async = require('async'),
    error = require('../common/error'),
    userConfig = require('../common/api').userConfig;

var mongo = {};

// Find the index for the specified database in the specified database array.
//    Returns -1 if not found.
//
var databaseInArray = function(databases, name) {
  var database;

  for (var i = 0; database = databases[i]; i++) {
    if (database.name.toUpperCase() === name.toUpperCase()) return i;
  }

  return -1;
};

//-------------------------------------------------------------------------------------------------
mongo.create = function(dbName, cb) {
  var createDatabase = function(dname) {
    mongoController.create(
      dname,
      userConfig.data.userId,
      function(err, database) {
        if(err) {
          err = error.handleApiError(err, 'CREATE_MONGO', cb);
          if(err.length > 0) {
            return cb(err);
          }
        }
        if(!database) {
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
mongo.createUser = function(username, password, database, readWrite, cb) {

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

//-----------------------------------------------------------------------------
/**
 * Displays a prompt for choosing databases.
 * @param {Array} databases Array of user's database.
 * @param {String} [databaseName] Default selection.
 * @param {Function} cb
 */
//-------------------------------------------------------------------------------------------------
mongo.chooseDatabasePrompt = function(databases, databaseName, cb) {
  var databaseIndex = -1,
      metaPath = null,
      foundPrint = 'Selecting %s\n';

  if(typeof projectName === 'function') {
    cb = projectName;
    projectName = null;
  }

  // A default selection has been made. See if a match exists in the collection.
  if(typeof databaseName === 'string') {
    databaseIndex = databaseInArray(databases, databaseName);
    if (databaseIndex >= 0) return cb(null, databases[databaseIndex]);

    // No match was found. Error out.
    return cb({ code: 'NO_MATCHING_NAME' });
  }

  if(databases.length === 1) {
    var selectedDatabase = databases[0];
    modulus.io.prompt.get([{
      name : 'confirm',
      description : 'Are you sure you want to use database ' + selectedDatabase.name.data + '?',
      message : 'Acceptable response is "yes" or "no".',
      pattern : /^[yntf]{1}/i,
      default : 'yes'
    }], function(err, result) {
      if(err) {
        return error.handlePromptError(err, cb);
      }
      var y = /^[yt]{1}/i.test(result.confirm);
      var p = y ? selectedDatabase : null;
      return cb(null, p);
    });
  } else {
    modulus.io.print('Please choose which database to use:'.input);
    for(var i = 0, len = databases.length; i < len; i++) {
      var index = i + 1;
      modulus.io.print('  '  + index.toString().input + ') '.input + databases[i].name.input);
    }
    modulus.io.prompt.get([{
      name : 'database',
      description : 'Database Number?',
      warning : 'Database number has to be between 1 and ' + databases.length,
      required : true,
      type : 'number',
      minimum : 1,
      maximum : databases.length
    }], function(err, result) {
      if(err) {
        return error.handlePromptError(err, cb);
      }
      modulus.io.print(util.format(foundPrint, databases[result.project - 1].name.data));
      return cb(null, databases[result.project - 1]);
    });
  }
};

module.exports = mongo;