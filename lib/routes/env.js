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
  var help = new modulus.help('Environment Variables', modulus);

  // list command
  help.add('list', function() {
    this.line('env list'.verbose);
    this.line('Lists all environment variables for a project.'.input);
  });

  modulus.program
    .command('env list')
    .description('Lists all environment variables for a project.')
    .on('--help', help.commands.list)
    .action(function(){
      modulus.runCommand(modulus.commands.env.list, [modulus.program.projectName], true);
    });

  // set command
  help.add('set', function() {
    this.line('env set <name> <value>'.verbose);
    this.line('Sets a environment variable for a project.'.input);
  });

  modulus.program
    .command('env set','<name> <value>')
    .description('Sets an environment variable for a project.')
    .on('--help', help.commands.set)
    .action(function(name, value){
      modulus.runCommand(modulus.commands.env.set, [modulus.program.projectName, name, value], true);
    });

  // load command
  help.add('load', function() {
    this.line('env load <file>'.verbose);
    this.line('Set environment variables for a project using data loaded from a JSON file.'.input);
  });

  modulus.program
    .command('env load','<file>')
    .description('Set environment variables for a project using data loaded from a JSON file.')
    .on('--help', help.commands.set)
    .action(function(file){
      modulus.runCommand(modulus.commands.env.load, [modulus.program.projectName, file], true);
    });

  // get command
  help.add('get', function() {
    this.line('env get <name>'.verbose);
    this.line('Gets an environment variable for a project.'.input);
  });

  modulus.program
    .command('env get','<name>')
    .description('Gets an environment variable for a project.')
    .on('--help', help.commands.get)
    .action(function(name){
      modulus.runCommand(modulus.commands.env.get, [modulus.program.projectName, name], true);
    });

  // delete command
  help.add('delete', function() {
    this.line('env delete <name>'.verbose);
    this.line('Removes an environment variable for a project.'.input);
  });

  modulus.program
    .command('env delete','<name>')
    .description('Removes an environment variable for a project.')
    .on('--help', help.commands.delete)
    .action(function(name){
      modulus.runCommand(modulus.commands.env.delete, [modulus.program.projectName, name], true);
    });

  // Generic help for env commands
  modulus.program
    .command('env')
    .description('Lists available env commands.')
    .on('--help', help.getPrinter())
    .action(help.getPrinter());

  return {
    base : 'env',
    help : help
  };
};