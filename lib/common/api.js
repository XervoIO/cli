var UserConfig = require('./userConfig')
var Url = require('url')
var librarian = require('../librarian/librarian')
var apiUtil = require('@xervo/api-util')
var apiClient

var userConfig = new UserConfig()

userConfig.load()

if (userConfig.data && userConfig.data.api_uri) {
  var url = Url.parse(userConfig.data.api_uri)

  if (url.protocol === 'https:') {
    librarian.init(url.hostname, url.port || 443, true)
  } else {
    librarian.init(url.hostname, url.port || 80, false)
  }

  var api = userConfig.data.api_uri.split('://')
  apiClient = apiUtil({
    protocol: api[0],
    hostname: api[1],
    version: 'v2',
    token: userConfig.data.apiKey
  })
} else {
  librarian.init('api.xervo.io', 443, true)
}

module.exports = {
  librarian: librarian,
  apiUtil: apiClient,
  userConfig: new UserConfig()
}
