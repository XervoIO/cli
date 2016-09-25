var path       = require('path');

var colors     = require('./common/colors');
var userConfig = require('./common/api').userConfig;

var xervo     = module.exports;
var pkg = require('../package.json');
xervo.version = pkg.version;

xervo.program = require('commander-plus');
xervo.program.Settings.autoHelp = false;

xervo.io = require('./common/io');

xervo.printHeader = function () {
  xervo.io.print('   __    __   ______   _____    __  __   __       __  __   ______   '.verbose);
  xervo.io.print('  /\\ "-./  \\ /\\  __ \\ /\\  __-. /\\ \\/\\ \\ /\\ \\     /\\ \\/\\ \\ /\\  ___\\  '.verbose);
  xervo.io.print('  \\ \\ \\-./\\ \\\\ \\ \\/\\ \\\\ \\ \\/\\ \\\\ \\ \\_\\ \\\\ \\ \\____\\ \\ \\_\\ \\\\ \\___  \\ '.verbose);
  xervo.io.print('   \\ \\_\\ \\ \\_\\\\ \\_____\\\\ \\____- \\ \\_____\\\\ \\_____\\\\ \\_____\\\\/\\_____\\'.verbose);
  xervo.io.print('    \\/_/  \\/_/ \\/_____/ \\/____/  \\/_____/ \\/_____/ \\/_____/ \\/_____/'.verbose);
  xervo.io.print('');
  xervo.io.print('     Providing all the awesomeness that is Xervo, in a CLI.'.verbose);
  xervo.io.print('     http://help.xervo.io/customer/portal/articles/1701977'.verbose);
  xervo.io.print('');
};

xervo.commands         = {};
xervo.commands.user    = require('./commands/user');
xervo.commands.project = require('./commands/project');
xervo.commands.servo   = require('./commands/servo');
xervo.commands.env     = require('./commands/env');
xervo.commands.addons  = require('./commands/addOn');
xervo.commands.mongo   = require('./commands/mongo');
xervo.commands.config  = require('./commands/config');
xervo.commands.misc    = require('./commands/misc');
xervo.commands.status  = require('./commands/status');

var done = function (err) {
  if (err) {
    xervo.io.error(err);
    process.exit(1);
  } else {
    process.exit();
  }
};

xervo.runCommand = function (command, args, authRequired) {
  if (args) {
    if (typeof args === 'boolean') {
      authRequired = args;
      args = [];
    } else if(typeof args.length !== 'number') {
      args = [];
    }
  } else {
    args = [];
  }
  xervo.io.print('Welcome to ' + 'Xervo'.magenta);

  var diff = require('update-notifier')({
    pkg: pkg
  }).update;

  if (diff) {
    xervo.io.warning('Your version ' + diff.current.verbose + ' is behind the latest release ' + diff.latest.verbose + '.');
    xervo.io.print('Please update using "npm update -g @xervo/cli"');
  }

  function go() {
    args.push(done);
    command.apply(xervo, args);
  }

  if (authRequired) {
    xervo.commands.user.isAuthenticated(function (err, result) {
      if (!result) {
        xervo.io.error('Need to be logged in to execute this command.');
        xervo.io.print('Please log in with "xervo login" command.');
        return done();
      } else {
        go();
      }
    });
  } else {
    go();
  }
};

xervo.program.version(xervo.version);

//Include the help object
xervo.help = require('./common/help');

// Include routes
xervo.routes = [
  require('./routes/user')(xervo),
  require('./routes/project')(xervo),
  require('./routes/servo')(xervo),
  require('./routes/env')(xervo),
  require('./routes/addOn')(xervo),
  require('./routes/mongo')(xervo),
  require('./routes/config')(xervo),
  require('./routes/misc')(xervo),
  require('./routes/status')(xervo)
];

// The full help concats the route helps
xervo.printHelp = function () {
  xervo.printHeader();
  xervo.io.print('     Usage: xervo <command> <param1> <param2> ...');
  xervo.io.print('     Help format:'.input);
  xervo.io.print('     <command> (<alias>)'.input);
  xervo.io.print('     <description>'.input);
  xervo.io.print('');

  for (var r = 0; r < xervo.routes.length; r++) {
    xervo.routes[r].help.pad = 5;
    xervo.routes[r].help.print();
  }
};

// Help commands
xervo.program.on('noCommand', xervo.printHelp);
xervo.program
  .command('help')
  .description('Print help for all commands.')
  .on('--help', xervo.printHelp)
  .action(xervo.printHelp);

xervo.program
  .command('*')
  .action(function () {
    xervo.io.print('Command not found.');
  });

xervo.program.parse(process.argv);
