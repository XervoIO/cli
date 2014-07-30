var modulus = require('../modulus'),
    mongoController = require('../controllers/mongo'),
    util = require('util'),
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

//------------------------------------------------------------------------------
mongo.create = function(dbName, cb) {
  var createDatabase = function(dname, regionData) {
    mongoController.create(
      dname,
      userConfig.data.userId,
      regionData,
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
        modulus.io.print('Database available at: ' + database.uri.data);
        return cb();
    });
  };

  // If project name is passed do NOT prompt for name.
  if (dbName && dbName !== '') {
    modulus.io.print('Creating MongoDB database ' + dbName.data);

    mongo.chooseRegionPrompt(function (err, regionData) {
      if (err) {
        return cb('Could not create MongoDB database.');
      }

      createDatabase(dbName, regionData);
    });
  } else {
    mongo._createDatabasePrompt(function(err, name) {
      if (err) {
        return cb('Could not create MongoDB database.');
      }

      mongo.chooseRegionPrompt(function (err, regionData) {
        if (err) {
          return cb('Could not create MongoDB database.');
        }

        createDatabase(name, regionData);
      });
    });
  }
};

//------------------------------------------------------------------------------
mongo.createUser = function(databaseName, username, password, isReadOnly, cb) {

  // All parameters are optional
  // if all parameters -> find database by name

  // Choose database
  // Enter Username, Password, isReadOnly
  mongoController.databasesForUser(
    userConfig.data.userId,
    function(err, databases) {
      if(err) {
        err = error.handleApiError(err, 'GET_DATABASES', cb);
        if(err.length > 0) {
          return cb(err);
        }
      }
      if(databases.length === 0) {
        modulus.io.error('You currently have no databases. One can be created using the `mongo create` command.');
        return cb();
      }

      mongo.chooseDatabasePrompt(databases, databaseName, function(err, database) {
        if(err) {
          err = error.handleApiError(err, 'CREATE_MONGO_USER', cb);
          if(err.length > 0) {
            return cb(err);
          }
        }
        if(!database) {
          return cb('You must select a database.');
        }
        modulus.io.print('Selected MongoDB database ' + database.name.data + '.');

        mongo._userPrompt(username, password, isReadOnly, function(err, results) {
          if(err) {
            err = error.handleApiError(err, 'CREATE_MONGO_USER', cb);
            if(err.length > 0) {
              return cb(err);
            }
          }
          mongoController.createUser(
            database.id,
            results.username,
            results.password,
            results.isReadOnly,
            function(err, dbUser) {
              if(err) {
                err = error.handleApiError(err, 'CREATE_MONGO_USER', cb);
                if(err.length > 0) {
                  return cb(err);
                }
              }
              if(!dbUser) {
                return cb('Could not create MongoDB database user. Error from server.');
              }
              modulus.io.success('New MongoDB database user ' + results.username.data + ' created.');
              return cb();
          });
        });
      });
  });

};


//------------------------------------------------------------------------------
mongo._userPrompt = function(username, password, isReadOnly, cb) {
  var prompt = [],
      out = {};

  if(!username || username === '') {
    prompt.push({
      name: 'username',
      description: 'Enter username:',
      message: 'Username is required.',
      required: true
    });
  }

  if(!password || password === '') {
    prompt.push({
      name: 'password',
      description: 'Enter password:',
      message: 'Password is required.',
      hidden : true,
      required: true
    });
  }

  if(typeof isReadOnly !== 'boolean') {
    prompt.push({
      name : 'isReadOnly',
      description : 'Read only permissions?',
      message : 'Acceptable response is "yes" or "no".',
      pattern : /^[yntf]{1}/i,
      default : 'yes'
    });
  }

  if(prompt.length > 0) {
    modulus.io.prompt.get(prompt, function (err, results) {
      if(err) {
        return error.handlePromptError(err, cb);
      }
      out.username = results.username || username;
      out.password = results.password || password;
      if(results.isReadOnly) {
        out.isReadOnly = /^[yt]{1}/i.test(results.isReadOnly);
      } else {
        out.isReadOnly = isReadOnly;
      }
      return cb(null, out);
    });
  } else {
    return cb(null, {username: username, password: password, isReadOnly: isReadOnly});
  }
};

//------------------------------------------------------------------------------
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

//------------------------------------------------------------------------------
/**
 * Displays a prompt for choosing databases.
 * @param {Array} databases Array of user's database.
 * @param {String} [databaseName] Default selection.
 * @param {Function} cb
 */
//------------------------------------------------------------------------------
mongo.chooseDatabasePrompt = function(databases, databaseName, cb) {
  var databaseIndex = -1;

  if(typeof databaseName === 'function') {
    cb = databaseName;
    databaseName = null;
  }
  // A default selection has been made. See if a match exists in the collection.
  if(typeof databaseName === 'string' && databaseName !== '') {
    databaseIndex = databaseInArray(databases, databaseName);
    if (databaseIndex >= 0) return cb(null, databases[databaseIndex]);

    // No match was found. Error out.
    return cb({ code: 'NO_MATCHING_DB_NAME' });
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
      console.log('');
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
      return cb(null, databases[result.database - 1]);
    });
  }
};

//------------------------------------------------------------------------------
mongo.chooseRegionPrompt = function (callback) {
  mongoController.getDeployTargets(function (err, regions) {
    if (err) {
      return error.handlePromptError(err, callback);
    }

    modulus.io.print('Please choose a region:'.input);

    for (var i = 0; i < regions.length; i++) {

      modulus.io.print(util.format(
        '(%s) %s - %s %s', (i + 1),
        regions[i].version,
        regions[i].iaas,
        regions[i].region).input);
    }

    modulus.io.prompt.get([
      {
        name: 'region',
        description: 'Region?',
        type: 'number',
        warning: 'Region choice has to be between 1 and ' + regions.length,
        minimum: 1,
        maximum: regions.length
      }
    ], function (err, result) {
        if (err) {
          return error.handlePromptError(err, callback);
        }

        var selected = util.format(
          '%s (%s %s)',
          regions[result.region - 1].version,
          regions[result.region - 1].iaas,
          regions[result.region - 1].region
        );

        modulus.io.print(util.format('Select %s\n', selected.data));
        callback(null, regions[result.region - 1]);
      });
  });
};

module.exports = mongo;
