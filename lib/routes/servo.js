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

module.exports = function (modulus) {
  var help = new modulus.help('Servo', modulus);

  // list command
  help.add('list', function () {
    this.line('servo list'.verbose);
    this.line('View all servos you have.'.input);
    this.line('  options:'.input);
    this.line('    -p, --project-name   Name of the project whose servos you want to view.'.input);
  });

  modulus.program
    .command('servo list')
    .description('Lists all servos you currently have access to.')
    .on('--help', help.commands.list)
    .action(function () {
      modulus.runCommand(modulus.commands.servo.list, [modulus.program.projectName], true);
    });

  // restart command
  help.add('restart', function () {
    this.line('servo restart'.verbose);
    this.line('Restarts a servo.'.input);
    this.line('  options:'.input);
    this.line('    -i, --servo-id   Id of the servo you want to restart.'.input);
  });

  modulus.program
    .option('-i, --servo-id [id]', 'Id of the servo you want to restart.');

  modulus.program
    .command('servo restart')
    .description('Restarts a running servo.')
    .on('--help', help.commands.restart)
    .action(function () {
      modulus.runCommand(modulus.commands.servo.restart, [modulus.program.servoId], true);
    });

  // Generic help for servo commands
  modulus.program
    .command('servo')
    .description('Lists available servo commands.')
    .on('--help', help.getPrinter())
    .action(help.getPrinter());

  return {
    base : 'servo',
    help : help
  };
};