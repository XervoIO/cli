#!/usr/bin/env node
var colors = require('./common/colors'),
    userConfig = require('./common/api').userConfig;

var modulus = module.exports;

require('pkginfo')(module, 'version');

modulus.program = require('commander');

modulus.io = require('./common/io');

modulus.commands = {};
modulus.commands.user = require('./commands/user');
modulus.commands.project = require('./commands/project');

modulus.runCommand = function(command, authRequired) {
  modulus.io.print('Welcome to ' + 'Modulus'.magenta);
  if(authRequired) {
    if(!modulus.commands.user.isAuthenticated()) {
      modulus.io.error('Need to be logged in to execute this command.');
      modulus.io.print('Please log in with "modulus login" command.');
      return done();
    }
  }
  command(done);
};

modulus.program
  .version(modulus.version);
  //.option('-C, --chdir <path>', 'change the working directory')
  //.option('-T, --no-tests', 'ignore test hook');

// Include routes
require('./routes/user')(modulus);
require('./routes/project')(modulus);


var done = function(err) {
  if(err) {
    modulus.io.error(err);
    process.exit(1);
  } else {
    process.exit();
  }
};

modulus.program.parse(process.argv);