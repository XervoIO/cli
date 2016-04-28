/* eslint-disable no-underscore-dangle */
const Util = require('util');

const Modulus = require('../modulus');
const MongoController = require('../controllers/mongo');
const Errors = require('../common/error');
const UserConfig = require('../common/api').userConfig;

var mongo = {};
var print = Modulus.io.print;

// Find the index for the specified database in the specified database array.
//    Returns -1 if not found.
//
var databaseInArray = function (databases, name) {
  var database, i, databaseLength = databases.length;

  for (i = 0; i < databaseLength; ++i) {
    database = databases[i];
    if (database.name.toUpperCase() === name.toUpperCase()) return i;
  }

  return -1;
};

// ----------------------------------------------------------------------------
mongo.create = function (dbName, cb) {
  var createDatabase = function (dname, regionData) {
    MongoController.create(
      dname,
      UserConfig.data.userId,
      regionData,
      function (err, database) {
        if (err) {
          err = Errors.handleApiError(err, 'CREATE_MONGO', cb);
          if (err.length > 0) return cb(err);
        }
        if (!database) {
          return cb('Could not create MongoDB database. Error from server.');
        }
        Modulus.io.success('New MongoDB database ' + dname.data + ' created.');
        print('Database available at: ' + database.uri.data);
        return cb();
      });
  };

  // If project name is passed do NOT prompt for name.
  if (dbName && dbName !== '') {
    print('Creating MongoDB database ' + dbName.data);

    mongo.chooseRegionPrompt(function (err, regionData) {
      if (err) return cb('Could not create MongoDB database.');
      createDatabase(dbName, regionData);
    });
  } else {
    mongo._createDatabasePrompt(function (err, name) {
      if (err) return cb('Could not create MongoDB database.');

      mongo.chooseRegionPrompt(function (err, regionData) {
        if (err) return cb('Could not create MongoDB database.');
        createDatabase(name, regionData);
      });
    });
  }
};

// ----------------------------------------------------------------------------
mongo.createUser = function (databaseName, username, password, isReadOnly, cb) {
  // All parameters are optional
  // if all parameters -> find database by name

  // Choose database
  // Enter Username, Password, isReadOnly
  MongoController.databasesForUser(
    UserConfig.data.userId,
    function (err, databases) {
      if (err) {
        err = Errors.handleApiError(err, 'GET_DATABASES', cb);
        if (err.length > 0) return cb(err);
      }
      if (databases.length === 0) {
        Modulus.io.error('You currently have no databases. One can be created using the `mongo create` command.');
        return cb();
      }

      mongo.chooseDatabasePrompt(
        databases, databaseName, function (err, database) {
          if (err) {
            err = Errors.handleApiError(err, 'CREATE_MONGO_USER', cb);
            if (err.length > 0) return cb(err);
          }
          if (!database) return cb('You must select a database.');
          print('Selected MongoDB database ' + database.name.data + '.');

          mongo._userPrompt(
            username, password, isReadOnly, function (err, results) {
              if (err) {
                err = Errors.handleApiError(err, 'CREATE_MONGO_USER', cb);
                if (err.length > 0) return cb(err);
              }
              MongoController.createUser(
                database.id,
                results.username,
                results.password,
                results.isReadOnly,
                function (err, dbUser) {
                  if (err) {
                    err = Errors.handleApiError(err, 'CREATE_MONGO_USER', cb);
                    if (err.length > 0) return cb(err);
                  }
                  if (!dbUser) {
                    return cb('Could not create MongoDB database user. Error from server.');
                  }
                  Modulus.io.success('New MongoDB database user ' + results.username.data + ' created.');
                  return cb();
                });
            });
        });
    });
};

// ----------------------------------------------------------------------------
mongo._userPrompt = function (username, password, isReadOnly, cb) {
  var prompt = [];
  var out = {};

  if (!username || username === '') {
    prompt.push({
      name: 'username',
      description: 'Enter username:',
      message: 'Username is required.',
      required: true
    });
  }

  if (!password || password === '') {
    prompt.push({
      name: 'password',
      description: 'Enter password:',
      message: 'Password is required.',
      hidden: true,
      required: true
    });
  }

  if (typeof isReadOnly !== 'boolean') {
    prompt.push({
      name: 'isReadOnly',
      description: 'Read only permissions?',
      message: 'Acceptable response is "yes" or "no".',
      pattern: /^[yntf]{1}/i,
      default: 'yes'
    });
  }

  if (prompt.length > 0) {
    Modulus.io.prompt.get(prompt, function (err, results) {
      if (err) return Errors.handlePromptError(err, cb);
      out.username = results.username || username;
      out.password = results.password || password;
      if (results.isReadOnly) {
        out.isReadOnly = /^[yt]{1}/i.test(results.isReadOnly);
      } else {
        out.isReadOnly = isReadOnly;
      }
      return cb(null, out);
    });
  } else {
    return cb(
      null, { username: username, password: password, isReadOnly: isReadOnly }
    );
  }
};

// ----------------------------------------------------------------------------
mongo._createDatabasePrompt = function (cb) {
  Modulus.io.prompt.get([{
    name: 'name',
    description: 'Enter a database name:',
    maxLength: 50,
    required: true
  }], function (err, results) {
    if (err) return Errors.handlePromptError(err, cb);
    cb(null, results.name);
  });
};

// ----------------------------------------------------------------------------
/**
 * Displays a prompt for choosing databases.
 * @param {Array} databases Array of user's database.
 * @param {String} [databaseName] Default selection.
 * @param {Function} cb
 */
// ----------------------------------------------------------------------------
mongo.chooseDatabasePrompt = function (databases, databaseName, cb) {
  var i, index, len, msg, selectedDatabase, databaseIndex = -1;

  if (typeof databaseName === 'function') {
    cb = databaseName;
    databaseName = null;
  }
  // A default selection has been made. See if a match exists in the collection.
  if (typeof databaseName === 'string' && databaseName !== '') {
    databaseIndex = databaseInArray(databases, databaseName);
    if (databaseIndex >= 0) return cb(null, databases[databaseIndex]);

    // No match was found. Error out.
    return cb({ code: 'NO_MATCHING_DB_NAME' });
  }

  if (databases.length === 1) {
    selectedDatabase = databases[0];
    msg = Util.format(
      'Are you sure you want to use database %s ?',
      selectedDatabase.name.data
    );

    Modulus.io.prompt.get([{
      name: 'confirm',
      description: msg,
      message: 'Acceptable response is "yes" or "no".',
      pattern: /^[yntf]{1}/i,
      default: 'yes'
    }], function (err, result) {
      var y, p;

      if (err) return Errors.handlePromptError(err, cb);
      y = /^[yt]{1}/i.test(result.confirm);
      p = y ? selectedDatabase : null;
      print('');
      return cb(null, p);
    });
  } else {
    print('Please choose which database to use:'.input);
    for (i = 0, len = databases.length; i < len; ++i) {
      index = i + 1;
      print(
        '  ' + index.toString().input + ') '.input + databases[i].name.input
      );
    }

    Modulus.io.prompt.get([{
      name: 'database',
      description: 'Database Number?',
      warning: 'Database number has to be between 1 and ' + databases.length,
      required: true,
      type: 'number',
      minimum: 1,
      maximum: databases.length
    }], function (err, result) {
      if (err) return Errors.handlePromptError(err, cb);
      return cb(null, databases[result.database - 1]);
    });
  }
};

// ----------------------------------------------------------------------------
mongo.chooseRegionPrompt = function (callback) {
  MongoController.getDeployTargets(function (err, regions) {
    var i;
    if (err) return Errors.handlePromptError(err, callback);
    print('Please choose a region:'.input);

    for (i = 0; i < regions.length; ++i) {
      print(Util.format(
        '(%s) %s - %s %s', i + 1,
        regions[i].version,
        regions[i].iaas,
        regions[i].region).input);
    }

    Modulus.io.prompt.get([
      {
        name: 'region',
        description: 'Region?',
        type: 'number',
        warning: 'Region choice has to be between 1 and ' + regions.length,
        minimum: 1,
        maximum: regions.length
      }
    ], function (err, result) {
      var selected;
      if (err) return Errors.handlePromptError(err, callback);
      selected = Util.format(
        '%s (%s %s)',
        regions[result.region - 1].version,
        regions[result.region - 1].iaas,
        regions[result.region - 1].region
      );

      print(Util.format('Select %s\n', selected.data));
      callback(null, regions[result.region - 1]);
    });
  });
};

module.exports = mongo;
/* eslint-enable no-underscore-dangle */
