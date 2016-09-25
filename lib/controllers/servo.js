var Errors     = require('../util/errors');
var librarian  = require('../common/api').librarian;
var xervo      = require('../xervo');
var Progress   = require('../util/progress');
var userConfig = require('../common/api').userConfig;

//-----------------------------------------------------------------------------
var Servo = function () {};

//-----------------------------------------------------------------------------
Servo.prototype.find = function (servoId, callback) {
  librarian.servo.get(servoId, userConfig.data.apiKey, callback);
};

//-----------------------------------------------------------------------------
Servo.prototype.list = function (opts, callback) {
  librarian.servo.getAll(opts, userConfig.data.apiKey, callback);
};

//-----------------------------------------------------------------------------
Servo.prototype.restart = function (servoId, callback) {
  librarian.servo.restart(servoId, userConfig.data.apiKey, function (err, result) {
    if (err) return callback(Errors.getMessage(err));

    var dbar = new Progress.indeterminate('Restarting [:bar]');
    xervo.io.startIndeterminate(dbar);

    var checkStatus = function() {
      librarian.servo.get(servoId, userConfig.data.apiKey, function (err, servo) {
        if (err) return callback(Errors.getMessage(err));

        if (servo.status.toLowerCase() === 'running') {
          xervo.io.stopIndeterminate(dbar);
          xervo.io.print(' ');
          return callback(null, servo);
        } else {
          setTimeout(checkStatus, 1000);
        }
      });
    };

    setTimeout(checkStatus, 1000);
  });
};

module.exports = new Servo();
