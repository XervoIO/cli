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

module.exports = function(modulus) {
  var help = new modulus.help('Configuration', modulus);

  help.add('get', function() {
    this.line('config get <name>'.verbose);
    this.line('Get a configuration value.'.input);
  });

  modulus.program
    .command('config get', '<name>')
    .description('Get a configuration value.')
    .on('--help', help.commands.get)
    .action(function(name) {
      modulus.runCommand(modulus.commands.config.get, [name], false);
    });

  help.add('set', function() {
    this.line('config set <name> <value>'.verbose);
    this.line('Set a configuration value.'.input);
  });

  modulus.program
    .command('config set', '<name> <value>')
    .description('Set a configuration value.')
    .on('--help', help.commands.set)
    .action(function(name, value) {
      modulus.runCommand(modulus.commands.config.set, [name, value], false);
    });

  return { base: 'config', help: help };
};
