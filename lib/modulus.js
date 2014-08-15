/*
 * Copyright (c) 2014 Modulus
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 */

var colors = require('./common/colors'),
    userConfig = require('./common/api').userConfig;

var modulus = module.exports;

require('pkginfo')(module, 'version');

modulus.program = require('commander-plus');
modulus.program.Settings.autoHelp = false;

modulus.io = require('./common/io');

modulus.printHeader = function() {
  modulus.io.print('   __    __   ______   _____    __  __   __       __  __   ______   '.verbose);
  modulus.io.print('  /\\ "-./  \\ /\\  __ \\ /\\  __-. /\\ \\/\\ \\ /\\ \\     /\\ \\/\\ \\ /\\  ___\\  '.verbose);
  modulus.io.print('  \\ \\ \\-./\\ \\\\ \\ \\/\\ \\\\ \\ \\/\\ \\\\ \\ \\_\\ \\\\ \\ \\____\\ \\ \\_\\ \\\\ \\___  \\ '.verbose);
  modulus.io.print('   \\ \\_\\ \\ \\_\\\\ \\_____\\\\ \\____- \\ \\_____\\\\ \\_____\\\\ \\_____\\\\/\\_____\\'.verbose);
  modulus.io.print('    \\/_/  \\/_/ \\/_____/ \\/____/  \\/_____/ \\/_____/ \\/_____/ \\/_____/'.verbose);
  modulus.io.print('');
  modulus.io.print('     Providing all the awesomeness that is Modulus, in a CLI.'.verbose);
  modulus.io.print('     https://modulus.io/codex/cli/using_the_cli'.verbose);
  modulus.io.print('');
};

modulus.commands = {};
modulus.commands.user = require('./commands/user');
modulus.commands.project = require('./commands/project');
modulus.commands.env = require('./commands/env');
modulus.commands.addons = require('./commands/addOn');
modulus.commands.mongo = require('./commands/mongo');
modulus.commands.config = require('./commands/config');
modulus.commands.misc = require('./commands/misc');

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

  var diff = require('update-notifier')({
    packagePath: __dirname + '/../package.json'
  }).update;

  if(diff) {
    modulus.io.warning('Your version ' + diff.current.verbose + ' is behind the latest release ' + diff.latest.verbose + '.');
    modulus.io.print('Please update using "npm update -g modulus"');
  }

  function go(){
    args.push(done);
    command.apply(modulus, args);
  }

  if(authRequired) {
    modulus.commands.user.isAuthenticated(function(err, result) {
      if(!result) {
        modulus.io.error('Need to be logged in to execute this command.');
        modulus.io.print('Please log in with "modulus login" command.');
        return done();
      }
      else {
        go();
      }
    });
  }
  else {
    go();
  }
};

modulus.program
  .version(modulus.version);

//Include the help object
modulus.help = require('./common/help');

// Include routes
modulus.routes = [
  require('./routes/user')(modulus),
  require('./routes/project')(modulus),
  require('./routes/env')(modulus),
  require('./routes/addOn')(modulus),
  require('./routes/mongo')(modulus),
  require('./routes/config')(modulus),
  require('./routes/misc')(modulus)
];

// The full help concats the route helps
modulus.printHelp = function() {
  modulus.printHeader();
  modulus.io.print('     Usage: modulus <command> <param1> <param2> ...');
  modulus.io.print('     Help format:'.input);
  modulus.io.print('     <command> (<alias>)'.input);
  modulus.io.print('     <description>'.input);
  modulus.io.print('');

  for(var r = 0; r < modulus.routes.length; r++) {
    modulus.routes[r].help.pad = 5;
    modulus.routes[r].help.print();
  }
};

// Help commands
modulus.program.on('noCommand', modulus.printHelp);
modulus.program
  .command('help')
  .description('Print help for all commands.')
  .on('--help', modulus.printHelp)
  .action(modulus.printHelp);

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
