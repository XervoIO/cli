var xervo = require('../xervo'),
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

mongo.list = function (cb) {
  mongoController.find({
      userId : userConfig.data.userId
    },
    function (err, mongos) {
      var table = [];
      if (err) {
        err = error.handleApiError(err, 'MONGO_LIST', cb);
        if (err.length > 0) {
          return cb(err);
        }
      }

      if (mongos.length === 0) {
        xervo.io.print('You currently have no mongos. You can create one with "mongo create".');
        return cb();
      }

      function getURI(mongo) {
        var ret = '';

        if (database.uri.length > 0) {
          ret = database.uri[0].uri;
        } else {
          ret = database.uri;
        }

        ret = ret.replace('*.', '');

        return ret.indexOf('http') >= 0 ? ret : 'http://' + ret;
      }

      mongos = _.sortBy(mongos, 'creator');

      var userMongos = [];
      var orgMongos  = [];

      mongos.forEach(function (mongo) {
        if (userConfig.data.userId === mongo.creator) {
          userMongos.push(mongo);
        } else {
          orgMongos.push(mongo);
        }
      });

      // make sure the current user's mongos display first
      var mong = userMongos.concat(orgMongos);

      var owners = {};
      xervo.io.print('Current mongos:'.input);
      async.mapSeries(mong, function (mongo, callback) {
        if (mongo.creator === userConfig.data.userId) {
          owners[mongo.creator] = userConfig.data.username;
          return callback(null, userConfig.data.username);
        }

        if (owners.hasOwnProperty(mongo.creator)) {
          return callback(null, owners[mongo.creator]);
        }

        userController.get(mongo.creator, function (err, user) {
          if (err) {
            if (err.errors && err.errors.length >= 1 &&
                err.errors[0].id === 'INVALID_AUTH') {
              // An invalid authorization error means that the user does not
              // have administrator access to the organization. In this case,
              // use a generic user header for the mongos.
              owners[mongo.creator] = 'User ' + mongo.creator;
              return callback(null, 'User ' + mongo.creator);
            }

            return callback(err);
          }

          owners[mongo.creator] = user.username;
          return callback(null, user.username);
        });
      }, function (err, results) {
        if (err) {
          err = error.handleApiError(err, 'MONGO_LIST', cb);
          if (err.length > 0) {
            cb(err);
          }

          return;
        }

        mong.forEach(function (mongo, index) {
          // display only one user/organization header
          if (owners[mongo.creator] === results[index]) {
            table.push([], [owners[mongo.creator].main], ['----------------------']);
            delete owners[mongo.creator];
          }

          table.push([
            mongo.name.data,
            getDomain(mongo)
          ]);
        });

        xervo.io.print(createTable(table));

        return cb(err);
      });
    }
  );
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
        xervo.io.success('New MongoDB database ' + dname.data + ' created.');
        xervo.io.print('Database available at: ' + database.uri.data);
        return cb();
    });
  };

  // If mongo name is passed do NOT prompt for name.
  if (dbName && dbName !== '') {
    xervo.io.print('Creating MongoDB database ' + dbName.data);

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
        xervo.io.error('You currently have no databases. One can be created using the `mongo create` command.');
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
        xervo.io.print('Selected MongoDB database ' + database.name.data + '.');

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
              xervo.io.success('New MongoDB database user ' + results.username.data + ' created.');
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
    xervo.io.prompt.get(prompt, function (err, results) {
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
  xervo.io.prompt.get([{
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
    xervo.io.prompt.get([{
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
    xervo.io.print('Please choose which database to use:'.input);
    for(var i = 0, len = databases.length; i < len; i++) {
      var index = i + 1;
      xervo.io.print('  '  + index.toString().input + ') '.input + databases[i].name.input);
    }
    xervo.io.prompt.get([{
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

    xervo.io.print('Please choose a region:'.input);

    for (var i = 0; i < regions.length; i++) {

      xervo.io.print(util.format(
        '(%s) %s - %s %s', (i + 1),
        regions[i].version,
        regions[i].iaas,
        regions[i].region).input);
    }

    xervo.io.prompt.get([
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

        xervo.io.print(util.format('Select %s\n', selected.data));
        callback(null, regions[result.region - 1]);
      });
  });
};

module.exports = mongo;
