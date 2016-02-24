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

const Path = require('path');
const Diff = require('update-notifier');

const Modulus = module.exports;

const User = require('./routes/user')(Modulus);
const Project = require('./routes/project')(Modulus);
const Servo = require('./routes/servo')(Modulus);
const Env = require('./routes/env')(Modulus);
const AddOn = require('./routes/addOn')(Modulus);
const Mongo = require('./routes/mongo')(Modulus);
const Config = require('./routes/config')(Modulus);
const Misc = require('./routes/misc')(Modulus);
const Status = require('./routes/status')(Modulus);

var done, exit = process.exit;

Modulus.version = require('../package').version;
Modulus.program = require('commander-plus');
Modulus.program.Settings.autoHelp = false;
Modulus.io = require('./common/io');

Modulus.printHeader = function () {
  Modulus.io.print('   __    __   ______   _____    __  __   __       __  __   ______   '.verbose);
  Modulus.io.print('  /\\ "-./  \\ /\\  __ \\ /\\  __-. /\\ \\/\\ \\ /\\ \\     /\\ \\/\\ \\ /\\  ___\\  '.verbose);
  Modulus.io.print('  \\ \\ \\-./\\ \\\\ \\ \\/\\ \\\\ \\ \\/\\ \\\\ \\ \\_\\ \\\\ \\ \\____\\ \\ \\_\\ \\\\ \\___  \\ '.verbose);
  Modulus.io.print('   \\ \\_\\ \\ \\_\\\\ \\_____\\\\ \\____- \\ \\_____\\\\ \\_____\\\\ \\_____\\\\/\\_____\\'.verbose);
  Modulus.io.print('    \\/_/  \\/_/ \\/_____/ \\/____/  \\/_____/ \\/_____/ \\/_____/ \\/_____/'.verbose);
  Modulus.io.print('');
  Modulus.io.print('     Providing all the awesomeness that is Modulus, in a CLI.'.verbose);
  Modulus.io.print('     http://help.Modulus.io/customer/portal/articles/1701977'.verbose);
  Modulus.io.print('');
};

Modulus.commands = {};
Modulus.commands.user = require('./commands/user');
Modulus.commands.project = require('./commands/project');
Modulus.commands.servo = require('./commands/servo');
Modulus.commands.env = require('./commands/env');
Modulus.commands.addons = require('./commands/addOn');
Modulus.commands.mongo = require('./commands/mongo');
Modulus.commands.config = require('./commands/config');
Modulus.commands.misc = require('./commands/misc');
Modulus.commands.status = require('./commands/status');

done = function (err) {
  if (err) {
    Modulus.io.error(err);
    exit(1);
  } else {
    exit();
  }
};

Modulus.runCommand = function (command, args, authRequired) {
  args = args || [];
  if (typeof args === 'boolean') {
    authRequired = args;
    args = [];
  }

  if (typeof args.length !== 'number') args = [];

  Modulus.io.print('Welcome to ' + 'Modulus'.magenta);

  Diff = Diff({
    packagePath: Path.resolve(__dirname, '..', 'package.json')
  }).update;

  if (Diff) {
    Modulus.io.warning('Your version ' + Diff.current.verbose + ' is behind the latest release ' + Diff.latest.verbose + '.');
    Modulus.io.print('Please update using "npm update -g Modulus"');
  }

  function go() {
    args.push(done);
    command.apply(Modulus, args);
  }

  if (authRequired) {
    Modulus.commands.user.isAuthenticated(function (err, result) {
      if (err) Modulus.io.error(err);
      if (result) go();
      else {
        Modulus.io.error('Need to be logged in to execute this command.');
        Modulus.io.print('Please log in with "Modulus login" command.');
        return done();
      }
    });
  } else {
    go();
  }
};

Modulus.program.version(Modulus.version);

// Include the help object
Modulus.help = require('./common/help');

// Include routes
Modulus.routes = [
  User, Project, Servo, Env, AddOn, Mongo, Config, Misc, Status
];

// The full help concats the route helps
Modulus.printHelp = function () {
  var i;
  Modulus.printHeader();
  Modulus.io.print('     Usage: Modulus <command> <param1> <param2> ...');
  Modulus.io.print('     Help format:'.input);
  Modulus.io.print('     <command> (<alias>)'.input);
  Modulus.io.print('     <description>'.input);
  Modulus.io.print('');

  for (i = 0; i < Modulus.routes.length; ++i) {
    Modulus.routes[i].help.pad = 5;
    Modulus.routes[i].help.print();
  }
};

// Help commands
Modulus.program.on('noCommand', Modulus.printHelp);
Modulus.program
  .command('help')
  .description('Print help for all commands.')
  .on('--help', Modulus.printHelp)
  .action(Modulus.printHelp);

Modulus.program .command('*') .action(function () {
  Modulus.io.print('Command not found.');
});

Modulus.program.parse(process.argv);
