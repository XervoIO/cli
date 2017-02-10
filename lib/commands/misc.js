var xervo = require('../xervo')
var async = require('async')
var userConfig = require('../common/api').userConfig
var librarian = require('../common/api').librarian
var userController = require('../controllers/user')

var misc = {}

misc.contact = function (message, cb) {
  async.waterfall([
    function (callback) {
      userController.get(userConfig.data.userId, callback)
    },
    function (user, callback) {
      librarian.contact({userId: user.id, email: user.email, message: message}, callback)
    }
  ], function (err, results) {
    if (err) xervo.io.error('Unable to send feedback, try help@xervo.io')
    else xervo.io.success('Feedback sent. Thank you for the message.')
    return cb()
  })
}

module.exports = misc
