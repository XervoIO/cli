/* eslint-disable no-underscore-dangle */
/*
 * Copyright (c) 2014 Modulus
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 *
 */

const Librarian_util = require('./util');
const Util = require('util');
const _ = require('underscore');
const Http = require('./http');

var urlRegex, checkInit, processURL;
var Librarian = {};
Librarian.user = {};
Librarian.addOns = {};
Librarian.project = {};
Librarian.pu = {};
Librarian.host = {};
Librarian.images = {};
Librarian.servo = {};
Librarian.activity = {};
Librarian.stats = {};
Librarian.database = {};
Librarian.ssl = {};
Librarian.util = Librarian_util;

Librarian._http = null;

Librarian.init = function (host, port, ssl) {
  if (!ssl) {
    ssl = false;
  }
  Librarian._http = new Http(host, port, ssl);
  return this;
};

// ----------------------------------------------------------------------------
// Request Forwarding
// ----------------------------------------------------------------------------

// Regex to process a URL with variables
urlRegex = /(:.+?)(?=:|[\/?]|$)/;

// Returns a function that express can use to process a request, but doesn't
// use express' body parser so the request is raw and unprocessed by express.
Librarian.forward = function (senderMehtod, senderURLPattern, targetURL, urlParams, headers, callback) {
  return function (req, res, next) {
    var tURL, header;
    if (req.url.match(senderURLPattern) && req.method === senderMehtod) {
      tURL = targetURL;
      if (urlRegex.test(tURL) === true && urlParams !== null) {
        tURL = processURL(targetURL, urlParams, req, res);
        if (tURL === null) {
          callback({ error: 'Bad URL' }, req, res);
          return;
        }
      }

      if (urlRegex.test(tURL) === false && urlParams !== null) {
        callback({ error: 'URL Error' }, req, res);
        return;
      }

      // Add any extra headers
      for (header in headers) {
        if ({}.hasOwnProperty.call(headers, header)) {
          req.headers[header] = headers[header];
        }
      }

      Librarian._http.forward(tURL, req, function (result, data) {
        if (result === null) return callback(null, null, req, res);
        if (result.error || result.erros) {
          return callback(result, null, req, res);
        }

        return callback(null, result, req, res);
      });
    }
  };
};

// Sets the variables in a URL based on a set of values/functions
processURL = function (url, params, req, res) {
  var p, param, urlSplit = url.split(urlRegex);
  for (p = 0; p < urlSplit.length; ++p) {
    if (urlSplit[p].length > 0 && urlSplit[p].substring(0, 1) === ':') {
      param = urlSplit[p].substring(1);
      if (params.hasOwnProperty(param)) {
        if (typeof params[param] === 'function') {
          urlSplit[p] = params[param](req, res);
        } else {
          urlSplit[p] = params[param];
        }

        if (urlSplit[p] === null) return null;
      } else {
        return null;
      }
    }
  }

  return urlSplit.join('');
};

// ----------------------------------------------------------------------------
Librarian.raw = function (url, method, data, callback) {
  if (checkInit(callback)) Librarian._http.request(url, method, data, callback);
};

// ----------------------------------------------------------------------------
// USERS
// ----------------------------------------------------------------------------
Librarian.user.create = function (user, callback) {
  if (checkInit(callback)) {
    Librarian._http.request('/user/create', 'POST', user, callback);
  }
};

// ----------------------------------------------------------------------------
Librarian.user.update = function (user, authToken, callback) {
  if (checkInit(callback)) {
    Librarian._http.request(
      Util.format('/user/%s?authToken=%s', user.id, authToken),
      'PUT',
      user,
      callback
    );
  }
};

// ----------------------------------------------------------------------------
Librarian.user.get = function (userId, authToken, callback) {
  if (checkInit(callback)) {
    Librarian._http.request(
      Util.format('/user/%s?authToken=%s', userId, authToken),
      'GET',
      callback
    );
  }
};

// ----------------------------------------------------------------------------
Librarian.user.getForToken = function (authToken, callback) {
  if (checkInit(callback)) {
    Librarian._http.request(
      Util.format('/user?authToken=%s', authToken),
      'GET',
      callback
    );
  }
};

// ----------------------------------------------------------------------------
Librarian.user.getAll = function (authToken, callback) {
  if (checkInit(callback)) {
    Librarian._http.request(
      Util.format('/users?authToken=%s', authToken),
      'GET',
      callback
    );
  }
};

// ----------------------------------------------------------------------------
Librarian.user.authenticate = function (login, passwordHash, callback) {
  if (checkInit(callback)) {
    Librarian._http.request(
      '/user/authenticate',
      'POST',
      { login: login, password: passwordHash },
      callback
    );
  }
};

// ----------------------------------------------------------------------------
Librarian.user.authenticateOAuth = function (type, token, callback) {
  if (checkInit(callback)) {
    Librarian._http.request(
      Util.format('/user/authenticate?type=%s&token=%s', type, token),
      'POST',
      {},
      callback
    );
  }
};

// ----------------------------------------------------------------------------
Librarian.user.delete = function (userId, authToken, callback) {
  if (checkInit(callback)) {
    Librarian._http.request(
      Util.format('/user/%s?authToken=%s', userId, authToken),
      'DELETE',
      callback
    );
  }
};

// ----------------------------------------------------------------------------
Librarian.user.getRoles = function (userId, authToken, callback) {
  if (checkInit(callback)) {
    Librarian._http.request(
      Util.format('/user/%s/roles?authToken=%s', userId, authToken),
      'GET',
      callback
    );
  }
};

// ----------------------------------------------------------------------------
Librarian.user.getRole = function (userId, projectId, authToken, callback) {
  if (checkInit(callback)) {
    Librarian._http.request(
      Util.format(
        '/user/%s/roles/%s?authToken=%s', userId, projectId, authToken
      ),
      'GET',
      callback
    );
  }
};

// ----------------------------------------------------------------------------
Librarian.user.activity = function (userId, authToken, callback) {
  if (checkInit(callback)) {
    Librarian._http.request(
      Util.format('/user/%s/activity?authToken=%s', userId, authToken),
      'GET',
      callback
    );
  }
};

// ----------------------------------------------------------------------------
Librarian.user.resetPassword = function (email, callback) {
  if (checkInit(callback)) {
    Librarian._http.request(
      '/user/password-reset', 'POST', { email: email }, callback
    );
  }
};

// ----------------------------------------------------------------------------
Librarian.user.createToken = function (userId, authToken, callback) {
  if (checkInit(callback)) {
    Librarian._http.request(
      Util.format('/user/%s/apiKey?authToken=%s', userId, authToken),
      'POST',
      callback
    );
  }
};

// ----------------------------------------------------------------------------
Librarian.user.getTokens = function (userId, authToken, callback) {
  if (checkInit(callback)) {
    Librarian._http.request(
      Util.format('/user/%s/apiKey?authToken=%s', userId, authToken),
      'GET',
      callback
    );
  }
};

// ----------------------------------------------------------------------------
Librarian.user.removeToken = function (token, userId, authToken, callback) {
  if (checkInit(callback)) {
    Librarian._http.request(
      Util.format('/user/%s/apiKey/%s?authToken=%s', userId, token, authToken),
      'DELETE',
      callback
    );
  }
};

// ----------------------------------------------------------------------------
Librarian.user.getDatabases = function (userId, authToken, callback) {
  if (checkInit(callback)) {
    Librarian._http.request(
      Util.format('/user/%s/databases?authToken=%s', userId, authToken),
      'GET',
      callback
    );
  }
};

// ----------------------------------------------------------------------------
// PROJECTS
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
Librarian.project.create = function (project, isShallow, authToken, callback) {
  if (checkInit(callback)) {
    if (_.isFunction(isShallow)) {
      callback = isShallow;
      isShallow = false;
    }

    Librarian._http.request(
      Util.format(
        '/project/create?isShallow=%s&authToken=%s', isShallow, authToken
      ),
      'POST',
      project,
      callback
    );
  }
};

/**
 * Finds projects based on filter criteria.
 * @static
 * @param {object} filter An object with one property - either
 * userId or projectId.  The value of the property is the search value.
 * If projectId is specified the result will be a single project object or null
 * if the project wasn't found.  If userId is specified the result will be an
 * array of project objects or an empty array if none were found.
 * @param {function} callback
 */
 // ---------------------------------------------------------------------------
Librarian.project.find = function (filter, authToken, callback) {
  if (checkInit(callback)) {
    if (typeof filter.userId !== 'undefined') {
      // Find all projects based on user.
      Librarian._http.request(
        Util.format('/user/%s/projects?authToken=%s', filter.userId, authToken),
        'GET',
        callback
      );
    }

    if (typeof filter.projectId !== 'undefined') {
      // Find the project with the specified id.
      Librarian._http.request(
        Util.format('/project/%s?authToken=%s', filter.projectId, authToken),
        'GET',
        callback
      );
    }
  }
};

// ----------------------------------------------------------------------------
Librarian.project.getStatus = function (projectId, authToken, callback) {
  if (checkInit(callback)) {
    Librarian._http.request(
      Util.format('/project/%s/status?authToken=%s', projectId, authToken),
      'GET',
      callback
    );
  }
};

// ----------------------------------------------------------------------------
Librarian.project.getAll = function (authToken, callback) {
  if (checkInit(callback)) {
    Librarian._http.request(
      Util.format('/projects?authToken=%s', authToken),
      'GET',
      callback
    );
  }
};

// ----------------------------------------------------------------------------
Librarian.project.update = function (project, authToken, callback) {
  if (checkInit(callback)) {
    Librarian._http.request(
      Util.format('/project/%s?authToken=%s', project.id, authToken),
      'PUT',
      project,
      callback
    );
  }
};

// ----------------------------------------------------------------------------
Librarian.project.getFiles = function (projectId, authToken, callback) {
  if (checkInit(callback)) {
    Librarian._http.request(
      Util.format('/project/%s/files?authToken=%s', projectId, authToken),
      'GET',
      callback
    );
  }
};

// ----------------------------------------------------------------------------
Librarian.project.getLog = function (projectId, authToken, callback) {
  if (checkInit(callback)) {
    Librarian._http.request(
      Util.format('/project/%s/logs?authToken=%s', projectId, authToken),
      'GET',
      callback
    );
  }
};

// ----------------------------------------------------------------------------
Librarian.project.downloadLogs = function (projectId, authToken, callback) {
  if (checkInit(callback)) {
    Librarian._http.raw(
      Util.format(
        '/project/%s/logs/download?authToken=%s', projectId, authToken
      ),
      'GET',
      callback
    );
  }
};

// ----------------------------------------------------------------------------
Librarian.project.clearLogs = function (projectId, authToken, callback) {
  if (checkInit(callback)) {
    Librarian._http.request(
      Util.format('/project/%s/logs/clear?authToken=%s', projectId, authToken),
      'GET',
      callback
    );
  }
};

// ----------------------------------------------------------------------------
Librarian.project.getDeployLogs = function (projectId, authToken, callback) {
  if (checkInit(callback)) {
    Librarian._http.request(
      Util.format('/project/%s/deploy-logs?authToken=%s', projectId, authToken),
      'GET',
      callback
    );
  }
};

// ----------------------------------------------------------------------------
Librarian.project.uploadProgress = function (projectId, authToken, callback) {
  if (checkInit(callback)) {
    Librarian._http.request(
      Util.format(
        '/project/%s/upload-progress?authToken=%s', projectId, authToken
      ),
      'GET',
      callback
    );
  }
};

// ----------------------------------------------------------------------------
Librarian.project.saveVars = function (projectId, vars, authToken, callback) {
  if (checkInit(callback)) {
    Librarian._http.request(
      Util.format('/project/%s/env-vars?authToken=%s', projectId, authToken),
      'POST',
      vars,
      callback
    );
  }
};

// ----------------------------------------------------------------------------
Librarian.project.saveDomains = function (projectId, domains, authToken, callback) {
  if (checkInit(callback)) {
    Librarian._http.request(
      Util.format('/project/%s/domains?authToken=%s', projectId, authToken),
      'POST',
      domains,
      callback
    );
  }
};

// ----------------------------------------------------------------------------
Librarian.project.getDatabases = function (projectId, authToken, callback) {
  if (checkInit(callback)) {
    Librarian._http.request(
      Util.format('/project/%s/databases?authToken=%s', projectId, authToken),
      'GET',
      callback
    );
  }
};

// ----------------------------------------------------------------------------
Librarian.project.delete = function (projectId, authToken, callback) {
  if (checkInit(callback)) {
    Librarian._http.request(
      Util.format('/project/%s?authToken=%s', projectId, authToken),
      'DELETE',
      callback
    );
  }
};

// ----------------------------------------------------------------------------
Librarian.project.stop = function (projectId, authToken, callback) {
  if (checkInit(callback)) {
    Librarian._http.request(
      Util.format('/project/%s/stop?authToken=%s', projectId, authToken),
      'GET',
      callback
    );
  }
};

// ----------------------------------------------------------------------------
Librarian.project.restart = function (projectId, authToken, callback) {
  if (checkInit(callback)) {
    Librarian._http.request(
      Util.format('/project/%s/restart?authToken=%s', projectId, authToken),
      'GET',
      callback
    );
  }
};

// ----------------------------------------------------------------------------
Librarian.project.start = function (projectId, authToken, callback) {
  if (checkInit(callback)) {
    Librarian._http.request(
      Util.format('/project/%s/start?authToken=%s', projectId, authToken),
      'GET',
      callback
    );
  }
};

// ----------------------------------------------------------------------------
Librarian.project.scale = function (projectId, instances, authToken, callback) {
  if (checkInit(callback)) {
    Librarian._http.request(
      Util.format('/project/%s/scale?authToken=%s', projectId, authToken),
      'POST',
      instances,
      callback
    );
  }
};

// ----------------------------------------------------------------------------
// ADDONS
// ----------------------------------------------------------------------------
Librarian.addOns.getByProject = function (projectId, authToken, callback) {
  if (checkInit(callback)) {
    Librarian._http.request(
      Util.format('/project/%d/addons?authToken=%s', projectId, authToken),
      'GET',
      callback
    );
  }
};

// ----------------------------------------------------------------------------
Librarian.addOns.getById = function (id, callback) {
  if (checkInit(callback)) {
    Librarian._http.request(Util.format('/addons/%s', id), 'GET', callback);
  }
};

// ----------------------------------------------------------------------------
Librarian.addOns.getConfigVars = function (projectId, authToken, callback) {
  if (checkInit(callback)) {
    Librarian._http.request(
      Util.format(
        '/project/%s/addons/config-vars?authToken=%s', projectId, authToken
      ),
    'GET',
    callback
    );
  }
};

// ----------------------------------------------------------------------------
Librarian.addOns.provision = function (userId, addOnId, plan, projectId, options, region, authToken, callback) {
  var url;
  if (checkInit(callback)) {
    url = Util.format(
      '/addon/provision/%s?authToken=%s&addonid=%s&plan=%s&projectid=%s&region=%s',
      userId,
      authToken,
      addOnId,
      plan,
      projectId,
      encodeURIComponent(region)
    );

    Librarian._http.request(url, 'POST', options, callback);
  }
};

// ----------------------------------------------------------------------------
Librarian.addOns.deprovision = function (projectId, modulusId, authToken, callback) {
  var url;
  if (checkInit(callback)) {
    url = Util.format(
      '/addon/deprovision/%d?authToken=%s&modulusid=%s',
       projectId,
       authToken,
       modulusId
    );

    Librarian._http.request(url, 'POST', {}, callback);
  }
};

// ----------------------------------------------------------------------------
// CONTACT
// ----------------------------------------------------------------------------

/**
 * Sends a email to Modulus support.
 * @static
 * @param {object} form Form object
 * { email: 'test@example.com', message: 'Something' }
 * @param {function} callback
 */
// ----------------------------------------------------------------------------
Librarian.contact = function (form, callback) {
  if (checkInit(callback)) {
    Librarian._http.request('/contact', 'POST', form, callback);
  }
};

// ----------------------------------------------------------------------------
// STATS
// ----------------------------------------------------------------------------

/**
 * Gets stat data.
 * @static
 * @param {string} name The name of the stat to retrieve.
 * e.g. atlas_response_global
 * @param {string} type The type of aggregation ('average' or 'sum')
 * @param {int} resolution The number of seconds to group data by
 * @param {int} duration The number of seconds into the past to retrieve data
 * @param {function} callback
 */
// ----------------------------------------------------------------------------
Librarian.stats.get = function (name, type, resolution, duration, authToken, callback) {
  var url;
  if (checkInit(callback)) {
    url = Util.format(
      '/stats?name=%s&type=%s&resolution=%s&duration=%s&authToken=%s',
      name, type, resolution, duration, authToken
    );

    Librarian._http.request(url, 'GET', callback);
  }
};

/**
 * Gets route stat data.
 * @static
 * @param {string} type The type of aggregation ('average' or 'sum')
 * e.g. atlas_response_global
 * @param {string} sort How the data should be sorted. Possible values are
 * 'count', 'average', 'bandwidth', or 'value'.
 * @param {int} duration The number of seconds into the past to retrieve data
 * @param {int} limit The number of unique routes to retrieve.
 * @param {function} callback
 */
// ----------------------------------------------------------------------------
Librarian.stats.routes = function (type, sort, duration, limit, authToken, callback) {
  var url;
  if (checkInit(callback)) {
    url = Util.format(
      '/stats/routes?type=%s&sort=%s&duration=%s&limit=%s&authToken=%s',
      type, sort, duration, limit, authToken
    );

    Librarian._http.request(url, 'GET', callback);
  }
};

// ----------------------------------------------------------------------------
// DATABASE
// ----------------------------------------------------------------------------

/**
 * Creates a new database.
 * @param {object} db The database to create. Object should contain
 * a name and an optional array of users. User object should contain
 * username and password properties.
 * @param {function} callback
 */
 // ----------------------------------------------------------------------------
Librarian.database.create = function (db, authToken, callback) {
  if (checkInit(callback)) {
    Librarian._http.request(
      Util.format('/db/create?authToken=%s', authToken),
      'POST',
      db,
      callback
    );
  }
};

// ----------------------------------------------------------------------------
Librarian.database.delete = function (id, authToken, callback) {
  if (checkInit(callback)) {
    Librarian._http.request(
      Util.format('/db/%s?authToken=%s', id, authToken),
      'DELETE',
      callback
    );
  }
};

// ----------------------------------------------------------------------------
Librarian.database.getDeployTargets = function (callback) {
  if (checkInit(callback)) {
    Librarian._http.request('/db/deploy-targets', 'GET', callback);
  }
};

/**
 * Create a user in the specified database.
 * @param {string} dbId The database id.
 * @param {object} user The new user. Required to have username and password
 * fields.
 * @param {function} callback Returns the newly created user.
 */
// ----------------------------------------------------------------------------
Librarian.database.createUser = function (dbId, user, authToken, callback) {
  if (checkInit(callback)) {
    Librarian._http.request(
      Util.format('/db/%s/user/create?authToken=%s', dbId, authToken),
      'POST',
      user,
      callback
    );
  }
};

// ----------------------------------------------------------------------------
Librarian.database.deleteUser = function (dbId, uId, authToken, callback) {
  if (checkInit(callback)) {
    Librarian._http.request(
      Util.format('/db/%s/user/%s?authToken=%s', dbId, uId, authToken),
      'DELETE',
      callback
    );
  }
};

// ----------------------------------------------------------------------------
Librarian.database.updateUser = function (dbId, uId, user, authToken, callback) {
  if (checkInit(callback)) {
    Librarian._http.request(
      Util.format('/db/%s/user/%s?authToken=%s', dbId, uId, authToken),
      'PUT',
      user,
      callback
    );
  }
};

// ----------------------------------------------------------------------------
Librarian.database.update = function (dbId, db, authToken, callback) {
  if (checkInit(callback)) {
    Librarian._http.request(
      Util.format('/db/%s?authToken=%s', dbId, authToken),
      'PUT',
      db,
      callback
    );
  }
};

// ----------------------------------------------------------------------------
Librarian.database.collections = function (dbId, authToken, callback) {
  if (checkInit(callback)) {
    Librarian._http.request(
      Util.format('/db/%s/collections?authToken=%s', dbId, authToken),
      'GET',
      callback
    );
  }
};

// ----------------------------------------------------------------------------
Librarian.database.exportCollections = function (dbId, username, password, collections, authToken, callback) {
  if (checkInit(callback)) {
    Librarian._http.request(
      Util.format('/db/%s/export?authToken=%s', dbId, authToken),
      'POST',
      { username: username, password: password, collections: collections },
      callback
    );
  }
};

// ----------------------------------------------------------------------------
Librarian.database.exportStatus = function (statusKey, callback) {
  if (checkInit(callback)) {
    Librarian._http.request(
      '/db/export-status?key=' + statusKey,
      'GET',
      callback
    );
  }
};

// ----------------------------------------------------------------------------
// SSL
// ----------------------------------------------------------------------------
Librarian.ssl.getAll = function (authToken, callback) {
  if (checkInit(callback)) {
    Librarian._http.request(
      Util.format('/ssls?authToken=%s', authToken),
      'GET',
      callback
    );
  }
};

// ----------------------------------------------------------------------------
Librarian.ssl.getForProject = function (projectId, authToken, callback) {
  if (checkInit(callback)) {
    Librarian._http.request(
      Util.format('/project/%s/ssl?authToken=%s', projectId, authToken),
      'GET',
      callback
    );
  }
};

// ----------------------------------------------------------------------------
Librarian.ssl.create = function (cert, authToken, callback) {
  if (checkInit(callback)) {
    Librarian._http.request(
      Util.format(
        '/project/%s/ssl/create?authToken=%s', cert.projectId, authToken
       ),
      'POST',
      cert,
      callback
    );
  }
};

// ----------------------------------------------------------------------------
Librarian.ssl.delete = function (sslId, authToken, callback) {
  if (checkInit(callback)) {
    Librarian._http.request(
      Util.format('/ssl/%s?authToken=%s', sslId, authToken),
      'DELETE',
      callback
    );
  }
};

// ----------------------------------------------------------------------------
Librarian.ssl.get = function (sslId, authToken, callback) {
  if (checkInit(callback)) {
    Librarian._http.request(
      Util.format('/ssl/%s?authToken=%s', sslId, authToken),
      'GET',
      callback
    );
  }
};

// ----------------------------------------------------------------------------
// IMAGES
// ----------------------------------------------------------------------------

Librarian.images.getAll = function (authToken, callback) {
  if (checkInit(callback)) {
    Librarian._http.request(
      Util.format('/images?authToken=%s', authToken),
      'GET',
      callback
    );
  }
};

// ----------------------------------------------------------------------------
// SERVOS
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
Librarian.servo.get = function (servoId, authToken, callback) {
  if (checkInit(callback)) {
    Librarian._http.request(
      Util.format('/servo/%s?authToken=%s', servoId, authToken),
      'GET',
      callback
    );
  }
};

// ----------------------------------------------------------------------------
Librarian.servo.getAll = function (filter, authToken, callback) {
  var idsQuery;
  if (typeof filter === 'string') {
    callback = authToken;
    authToken = filter;
    filter = {};
  }

  filter.ids = filter.ids || [];
  idsQuery = filter.ids.length ?
    Util.format('&ids[]=%s', filter.ids.join('&ids[]=')) : '';
  if (checkInit(callback)) {
    Librarian._http.request(
      Util.format('/servos?authToken=%s%s', authToken, idsQuery),
      'GET',
      callback
    );
  }
};

// ----------------------------------------------------------------------------
Librarian.servo.restart = function (servoId, authToken, callback) {
  if (checkInit(callback)) {
    Librarian._http.request(Util.format(
      '/servo/%s/restart?authToken=%s', servoId, authToken), 'GET', callback
    );
  }
};

// ----------------------------------------------------------------------------
checkInit = function (callback) {
  if (Librarian._http === null) {
    callback({ error: 'librarian API is not initialized.  Call init().' });
    return false;
  }
  return true;
};

module.exports = Librarian;
/* eslint-enable no-underscore-dangle */
