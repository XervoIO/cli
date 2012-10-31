var colors = require('./common/colors'),
    userConfig = require('./common/api').userConfig;

var modulus = module.exports;

require('pkginfo')(module, 'version');

modulus.program = require('commander');

modulus.io = require('./common/io');

modulus.commands = {};
modulus.commands.user = require('./commands/user');
modulus.commands.project = require('./commands/project');
modulus.commands.env = require('./commands/env');

modulus.runCommand = function(command, args, authRequired) {
  if(args) {
    if(typeof args === 'boolean') {
      authRequired = args;
      args = [];
    } else if(typeof args.length !== 'number') {
      args = [];
    }
  } else {
    args = [];
  }
  modulus.io.print('Welcome to ' + 'Modulus'.magenta);
  if(authRequired) {
    if(!modulus.commands.user.isAuthenticated()) {
      modulus.io.error('Need to be logged in to execute this command.');
      modulus.io.print('Please log in with "modulus login" command.');
      return done();
    }
  }
  args.push(done);
  command.apply(modulus, args);
};

modulus.program
  .version(modulus.version);

// Include routes
require('./routes/user')(modulus);
require('./routes/project')(modulus);
require('./routes/env')(modulus);

var done = function(err) {
  if(err) {
    modulus.io.error(err);
    process.exit(1);
  } else {
    process.exit();
  }
};

modulus.program
  .command('*')
  .action(function(){
    modulus.io.print('Command not found.');
  });

modulus.program.parse(process.argv);