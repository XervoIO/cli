var xervo = require('../xervo')
var mongoController = require('../controllers/mongo')
var util = require('util')
var error = require('../common/error')
var userConfig = require('../common/api').userConfig

var async = require('async')

var env = require('./env')
var project = require('./project')
var projectController = require('../controllers/project')
var addOnController = require('../controllers/addOn')

var mongo = {}

// Find the index for the specified database in the specified database array.
//    Returns -1 if not found.
//
var databaseInArray = function (databases, name) {
  for (var idx = 0; idx < databases.length; idx++) {
    if (databases[idx].name.toUpperCase() === name.toUpperCase()) return idx
  }

  return -1
}

// ------------------------------------------------------------------------------
mongo.create = function (dbName, cb) {
  var createDatabase = function (dname, regionData) {
    mongoController.create(
      dname,
      userConfig.data.userId,
      regionData,
      function (err, database) {
        if (err) {
          err = error.handleApiError(err, 'CREATE_MONGO', cb)
          if (err.length > 0) {
            return cb(err)
          }
        }
        if (!database) {
          return cb('Could not create MongoDB database. Error from server.')
        }
        xervo.io.success('New MongoDB database ' + dname.data + ' created.')
        xervo.io.print('Database available at: ' + database.uri.data)
        return cb()
      })
  }

  // If project name is passed do NOT prompt for name.
  if (dbName && dbName !== '') {
    xervo.io.print('Creating MongoDB database ' + dbName.data)

    mongo.chooseRegionPrompt(function (err, regionData) {
      if (err) {
        return cb('Could not create MongoDB database.')
      }

      createDatabase(dbName, regionData)
    })
  } else {
    mongo._createDatabasePrompt(function (err, name) {
      if (err) {
        return cb('Could not create MongoDB database.')
      }

      mongo.chooseRegionPrompt(function (err, regionData) {
        if (err) {
          return cb('Could not create MongoDB database.')
        }

        createDatabase(name, regionData)
      })
    })
  }
}

// ------------------------------------------------------------------------------
mongo.createUser = function (databaseName, username, password, isReadOnly, cb) {
  // All parameters are optional
  // if all parameters -> find database by name

  // Choose database
  // Enter Username, Password, isReadOnly
  mongoController.databasesForUser(
    userConfig.data.userId,
    function (err, databases) {
      if (err) {
        err = error.handleApiError(err, 'GET_DATABASES', cb)
        if (err.length > 0) {
          return cb(err)
        }
      }
      if (databases.length === 0) {
        xervo.io.error('You currently have no databases. One can be created using the `mongo create` command.')
        return cb()
      }

      mongo.chooseDatabasePrompt(databases, databaseName, function (err, database) {
        if (err) {
          err = error.handleApiError(err, 'CREATE_MONGO_USER', cb)
          if (err.length > 0) {
            return cb(err)
          }
        }
        if (!database) {
          return cb('You must select a database.')
        }
        xervo.io.print('Selected MongoDB database ' + database.name.data + '.')

        mongo._userPrompt(username, password, isReadOnly, function (err, results) {
          if (err) {
            err = error.handleApiError(err, 'CREATE_MONGO_USER', cb)
            if (err.length > 0) {
              return cb(err)
            }
          }
          mongoController.createUser(
            database.id,
            results.username,
            results.password,
            results.isReadOnly,
            function (err, dbUser) {
              if (err) {
                err = error.handleApiError(err, 'CREATE_MONGO_USER', cb)
                if (err.length > 0) {
                  return cb(err)
                }
              }
              if (!dbUser) {
                return cb('Could not create MongoDB database user. Error from server.')
              }
              xervo.io.success('New MongoDB database user ' + results.username.data + ' created.')
              return cb()
            })
        })
      })
    })
}

// ------------------------------------------------------------------------------
mongo.migrate = function (databaseName, version, cb) {
  mongoController.databasesForUser(
    userConfig.data.userId,
    function (err, databases) {
      var dbExists = false

      if (err) {
        err = error.handleApiError(err, 'GET_DATABASES', cb)
        if (err.length > 0) {
          return cb(err)
        }
      }
      if (databases.length === 0) {
        return cb('You currently have no databases. One can be created using the `mongo create` command.')
      }

      if (databaseName !== '') {
        for (var i = 0; i < databases.length; i++) {
          if (databases[i].name === databaseName) {
            dbExists = true
          }
        }

        if (!dbExists) {
          xervo.io.error('No database found by that name in this account. Please try again with the correct name or omit the name to choose from a list.')
          return cb()
        }
      }

      mongo.chooseDatabasePrompt(databases, databaseName, function (err, database) {
        if (err) {
          return error.handlePromptError(err, cb)
        }
        if (!database) {
          return cb('You must select a database.')
        }
        xervo.io.print('Selected MongoDB database ' + database.name.data + '.')
        xervo.io.print('Migrating MongoDB database.')

        mongo.chooseRegionPrompt(function (err, regionData) {
          if (err) {
            return error.handlePromptError(err, cb)
          }

          var db = {
            name: database.name,
            id: database.id,
            userId: userConfig.data.userId,
            iaas: regionData.iaas,
            region: regionData.region,
            version: regionData.version
          }

          var hosts = {
            source: database.uri.split('/')[0]
          }

          mongoController.clone(db, hosts, function (err, database) {
            if (err) {
              return cb('Could not clone MongoDB database.')
            }

            xervo.io.success('MongoDB database ' + database.name + ' cloned to new host.')
            xervo.io.success('Database available at: ' + database.uri + '. Please update any running applications to use this db before removing your original.')

            // Create users for the new DB
            createUserOnClonedDB(database, false, function () {
              // Update project env vars to point to db and optionally restart
              setEnvVarsAndRestartProject(database, false, cb)
            })
          })
        })
      })
    })
}

// ------------------------------------------------------------------------------
function setEnvVarsAndRestartProject (database, repeatRun, cb) {
  var prompt = []
  var projectInfo

  prompt.push({
    name: 'setEnvVars',
    description: 'Do you want to update ' + (repeatRun ? 'another' : 'a') + ' project\'s environment variables to use this database?',
    message: 'Acceptable response is "yes" or "no".',
    pattern: /^[yntf]{1}/i,
    default: 'yes'
  })

  xervo.io.prompt.get(prompt, function (err, results) {
    if (err) {
      err = error.handleApiError(err, 'MIGRATE_MONGO', cb)
      if (err.length > 0) {
        return cb(err)
      }
    }

    if (results.setEnvVars === 'yes') {
      async.waterfall([
        function getUserProjects (fn) {
          projectController.find({ userId: userConfig.data.userId }, function (err, results) {
            if (err) {
              err = error.handleApiError(err, 'GET_PROJECTS', fn)
              if (err) return fn(err)
            }

            // If the user does not have any projects, the migration is complete
            if (results.length === 0) {
              xervo.io.print('No Projects found for your account.')
              xervo.io.success('MongoDB Migration Complete!')
              return cb()
            }

            fn(null, results)
          })
        },
        function chooseProject (results, fn) {
          project.chooseProjectPrompt(results, fn)
        },
        function getEnvVars (results, fn) {
          projectInfo = results

          addOnController.getConfigVars(results.id, fn)
        },
        function chooseEnvVar (results, fn) {
          if (results.length === 0 || (results.length === 1 && results[0].name === 'NODE_ENV')) {
            prompt = []
            prompt.push({
              name: 'createEnvVar',
              description: 'No environment variables found on this project. Do you want to add an environment variable for this database?',
              message: 'Acceptable response is "yes" or "no".',
              pattern: /^[yntf]{1}/i,
              default: 'yes'
            })

            xervo.io.prompt.get(prompt, function (err, results) {
              if (err) {
                err = error.handleApiError(err, 'MIGRATE_MONGO', fn)
                if (err.length > 0) {
                  return cb(err)
                }
              }

              if (results.createEnvVar === 'yes') {
                return fn(null, { name: 'MONGO_URL' })
              } else {
                // bail out and move to the next project
                return setEnvVarsAndRestartProject(database, true, fn)
              }
            })
          } else {
            env.chooseEnvVarPrompt(results, fn)
          }
        },
        function setEnvVar (results, fn) {
          // If a valid env var isn't returned, move to the next project
          if (!results) return setEnvVarsAndRestartProject(database, true, cb)

          var dbEnvVar = results

          // Ask for DB username and Password
          var prompt = []
          prompt.push({
            name: 'username',
            description: 'Enter username:',
            message: 'Username is required.',
            required: true
          })

          prompt.push({
            name: 'password',
            description: 'Enter password:',
            message: 'Password is required.',
            hidden: true,
            required: true
          })

          xervo.io.prompt.get(prompt, function (err, results) {
            if (err) {
              return error.handlePromptError(err, fn)
            }

            // Create MONGO_URL from db.uri and add user and pass
            var envValue = 'mongodb://' + results.username + ':' + results.password +
              '@' + database.uri + '?autoReconnect=true&connectTimeoutMS=60000'

            return env.set(projectInfo.name, dbEnvVar.name, envValue, fn)
          })
        },
        function restartProj (fn) {
          restartProject(projectInfo.name, fn)
        }],
        function (err, results) {
          if (err) {
            err = error.handleApiError(err, 'MIGRATE_MONGO', cb)
            if (err) return cb(err)
          }

          // rinse and repeat
          return setEnvVarsAndRestartProject(database, true, cb)
        })
    } else {
      xervo.io.success('MongoDB Migration Complete!')
      return cb()
    }
  })
}

// ------------------------------------------------------------------------------
function restartProject (projectName, cb) {
  var prompt = []
  prompt.push({
    name: 'restartProject',
    description: 'Do you want to restart project ' + projectName + '?',
    message: 'Acceptable response is "yes" or "no".',
    pattern: /^[yntf]{1}/i,
    default: 'no'
  })

  xervo.io.prompt.get(prompt, function (err, results) {
    if (err) {
      return error.handlePromptError(err, cb)
    }

    if (results.restartProject === 'yes') {
      return project.stopStartRestart('restart', projectName, cb)
    } else {
      return cb()
    }
  })
}

// ------------------------------------------------------------------------------
function createUserOnClonedDB (database, repeatRun, cb) {
  var prompt = []
  prompt.push({
    name: 'createDBUser',
    description: 'Do you want to add ' + (repeatRun ? 'another' : 'a') + ' user to this database?',
    message: 'Acceptable response is "yes" or "no".',
    pattern: /^[yntf]{1}/i,
    default: 'yes'
  })

  xervo.io.prompt.get(prompt, function (err, results) {
    if (err) {
      return error.handlePromptError(err, cb)
    }

    if (results.createDBUser === 'yes') {
      mongo._userPrompt(null, null, null, function (err, results) {
        if (err) {
          return error.handlePromptError(err, cb)
        }
        mongoController.createUser(
          database.id,
          results.username,
          results.password,
          results.isReadOnly,
          function (err, dbUser) {
            if (err) {
              err = error.handleApiError(err, 'CREATE_MONGO_USER', cb)
              if (err.length > 0) {
                return cb(err)
              }
            }
            if (!dbUser) {
              return cb('Could not create MongoDB database user. Error from server.')
            }
            xervo.io.success('New MongoDB database user ' + results.username.data + ' created.')
            return createUserOnClonedDB(database, true, cb)
          })
      })
    } else {
      return cb()
    }
  })
}

// ------------------------------------------------------------------------------
mongo._userPrompt = function (username, password, isReadOnly, cb) {
  var prompt = []
  var out = {}

  if (!username || username === '') {
    prompt.push({
      name: 'username',
      description: 'Enter username:',
      message: 'Username is required.',
      required: true
    })
  }

  if (!password || password === '') {
    prompt.push({
      name: 'password',
      description: 'Enter password:',
      message: 'Password is required.',
      hidden: true,
      required: true
    })
  }

  if (typeof isReadOnly !== 'boolean') {
    prompt.push({
      name: 'isReadOnly',
      description: 'Read only permissions?',
      message: 'Acceptable response is "yes" or "no".',
      pattern: /^[yntf]{1}/i,
      default: 'yes'
    })
  }

  if (prompt.length > 0) {
    xervo.io.prompt.get(prompt, function (err, results) {
      if (err) {
        return error.handlePromptError(err, cb)
      }
      out.username = results.username || username
      out.password = results.password || password
      if (results.isReadOnly) {
        out.isReadOnly = /^[yt]{1}/i.test(results.isReadOnly)
      } else {
        out.isReadOnly = isReadOnly
      }
      return cb(null, out)
    })
  } else {
    return cb(null, {username: username, password: password, isReadOnly: isReadOnly})
  }
}

// ------------------------------------------------------------------------------
mongo._createDatabasePrompt = function (cb) {
  xervo.io.prompt.get([{
    name: 'name',
    description: 'Enter a database name:',
    maxLength: 50,
    required: true
  }], function (err, results) {
    if (err) {
      return error.handlePromptError(err, cb)
    }
    cb(null, results.name)
  })
}

// ------------------------------------------------------------------------------
/**
 * Displays a prompt for choosing databases.
 * @param {Array} databases Array of user's database.
 * @param {String} [databaseName] Default selection.
 * @param {Function} cb
 */
// ------------------------------------------------------------------------------
mongo.chooseDatabasePrompt = function (databases, databaseName, cb) {
  var databaseIndex = -1

  if (typeof databaseName === 'function') {
    cb = databaseName
    databaseName = null
  }
  // A default selection has been made. See if a match exists in the collection.
  if (typeof databaseName === 'string' && databaseName !== '') {
    databaseIndex = databaseInArray(databases, databaseName)
    if (databaseIndex >= 0) return cb(null, databases[databaseIndex])

    // No match was found. Error out.
    return cb({ code: 'NO_MATCHING_DB_NAME' })
  }

  if (databases.length === 1) {
    var selectedDatabase = databases[0]
    xervo.io.prompt.get([{
      name: 'confirm',
      description: 'Are you sure you want to use database ' + selectedDatabase.name.data + '?',
      message: 'Acceptable response is "yes" or "no".',
      pattern: /^[yntf]{1}/i,
      default: 'yes'
    }], function (err, result) {
      if (err) {
        return error.handlePromptError(err, cb)
      }
      var y = /^[yt]{1}/i.test(result.confirm)
      var p = y ? selectedDatabase : null
      console.log('')
      return cb(null, p)
    })
  } else {
    xervo.io.print('Please choose which database to use:'.input)
    for (var i = 0, len = databases.length; i < len; i++) {
      var index = i + 1
      xervo.io.print('  ' + index.toString().input + ') '.input + databases[i].name.input)
    }
    xervo.io.prompt.get([{
      name: 'database',
      description: 'Database Number?',
      warning: 'Database number has to be between 1 and ' + databases.length,
      required: true,
      type: 'number',
      minimum: 1,
      maximum: databases.length
    }], function (err, result) {
      if (err) {
        return error.handlePromptError(err, cb)
      }
      return cb(null, databases[result.database - 1])
    })
  }
}

// ------------------------------------------------------------------------------
mongo.chooseRegionPrompt = function (callback) {
  mongoController.getDeployTargets(function (err, regions) {
    if (err) {
      return error.handlePromptError(err, callback)
    }

    xervo.io.print('Please choose a region:'.input)

    for (var i = 0; i < regions.length; i++) {
      xervo.io.print(util.format(
        '(%s) %s - %s %s', (i + 1),
        regions[i].version,
        regions[i].iaas,
        regions[i].region).input)
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
        return error.handlePromptError(err, callback)
      }

      var selected = util.format(
          '%s (%s %s)',
          regions[result.region - 1].version,
          regions[result.region - 1].iaas,
          regions[result.region - 1].region
        )

      xervo.io.print(util.format('Select %s\n', selected.data))
      callback(null, regions[result.region - 1])
    })
  })
}

module.exports = mongo
