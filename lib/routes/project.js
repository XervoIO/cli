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
  var help = new modulus.help('Project', modulus);

  // list commands
  help.add('list', function() {
    this.line('project list (list)'.verbose);
    this.line('View all projects you have.'.input);
  });

  modulus.program
    .command('project list')
    .description('Lists all projects you currently have access to.')
    .on('--help', help.commands.list)
    .action(function(){
      modulus.runCommand(modulus.commands.project.list, true);
    });

  modulus.program
    .command('list')
    .description('Lists all projects you currently have access to.')
    .on('--help', help.commands.list)
    .action(function(){
      modulus.runCommand(modulus.commands.project.list, true);
    });

  // create command
  help.add('create', function() {
    this.line('project create <name>'.verbose);
    this.line('Creates a new project.'.input);
    this.line('A prompt for name will occur if none is specified.'.input);
  });

  modulus.program
    .command('project create')
    .description('Creates a new project.')
    .on('--help', help.commands.create)
    .action(function(name){
      if(typeof name !== 'string') {
        name = '';
      }
      modulus.runCommand(modulus.commands.project.create, [name], true);
    });

  // restart command
  help.add('restart', function() {
    this.line('project restart'.verbose);
    this.line('Restarts a project.'.input);
    this.line('  options:'.input);
    this.line('    -p, --project-name    Name of the project to restart. Prompts are skipped when specified.'.input);
  });

  modulus.program
    .command('project restart')
    .description('Restarts a running project.')
    .on('--help', help.commands.create)
    .action(function() {
      modulus.runCommand(modulus.commands.project.restart, [modulus.program.projectName], true);
    });

  // stop command
  help.add('stop', function() {
    this.line('project stop'.verbose);
    this.line('Stops a running project'.input);
    this.line('  options:'.input);
    this.line('    -p, --project-name    Name of the project to stop. Prompts are skipped when specified.'.input);
  });

  modulus.program
    .command('project stop')
    .description('Stops a running project.')
    .on('--help', help.commands.create)
    .action(function() {
      modulus.runCommand(modulus.commands.project.stop, [modulus.program.projectName], true);
    });

  // start command
  help.add('start', function() {
    this.line('project start'.verbose);
    this.line('Starts a running project'.input);
    this.line('  options:'.input);
    this.line('    -p, --project-name    Name of the project to start. Prompts are skipped when specified.'.input);
  });

  modulus.program
    .command('project start')
    .description('Starts a stopped project.')
    .on('--help', help.commands.create)
    .action(function() {
      modulus.runCommand(modulus.commands.project.start, [modulus.program.projectName], true);
    });

  // deploy command
  help.add('deploy', function() {
    this.line('project deploy (deploy) [options] <directory>'.verbose);
    this.line('Deploys a directory\'s contents to the selected project.'.input);
    this.line('The current working directory is used if no directory is specified.'.input);
    this.line('By default a project type will be detected and any additional actions required will be taken.'.input);
    this.line('  options:'.input);
    this.line('    -p, --project-name      Name of the project to deploy. Prompts are skipped when specified.'.input);
    this.line('    -m, --include-modules   Flag that indicates whether or not to include the node_modules folder in the bundle.'.input);
    this.line('    -n, --node-version      Specifies the node version to use when deploying Meteor projects, if applicable.'.input);
    this.line('    -f, --force-npm-install Triggers a reinstall of node modules.'.input)
    this.line('    -r, --registry          Specify a registry to install modules from.'.input)
    this.line('    -t, --project-type      Specifies type of application you are deploying. Overrides the auto-detection that occurs normally. Acceptable types are listed below.'.input);
    this.line('      nodejs   A typical Node.js application.'.input);
    this.line('      meteor   A Meteor application.'.input);
  });

  modulus.program
    .option('-p, --project-name [value]', 'Name of the project to retrieve logs from. Prompts are skipped when specified')
    .option('-d, --download', 'Flag that signals to download the logs instead of printing them.')
    .option('-o, --output [value]', 'Specifies the file to download to. Must be file type tar.gz')
    .option('-m, --include-modules', 'Flag that indicates whether or not to include the node_modules folder in the bundle.')
    .option('-f, --force-npm-install', 'Triggers a reinstall of node modules')
    .option('-r, --registry [value]', 'Specify a registry to install modules from', '')
    .option('-n, --node-version [value]', 'Specifies the node version to use when demeteorizing the project, if applicable.')
    .option('-t, --project-type [value]', 'Specifies the type of application the project is. Ex: "node" or "meteor".');

  modulus.program
    .command('project deploy')
    .description('Deploys the current directory to selected project.')
    .on('--help', help.commands.deploy)
    .action(function(dir){
      modulus.runCommand(modulus.commands.project.deploy, [modulus.program.projectName, dir, modulus.program.projectType, modulus.program.includeModules, modulus.program.nodeVersion, modulus.program.forceNpmInstall, modulus.program.registry], true);
    });

  modulus.program
    .command('deploy')
    .description('Deploys the current directory to selected project.')
    .on('--help', help.commands.deploy)
    .action(function(dir) {
      modulus.runCommand(modulus.commands.project.deploy, [modulus.program.projectName, dir, modulus.program.projectType, modulus.program.includeModules, modulus.program.nodeVersion, modulus.program.forceNpmInstall, modulus.program.registry], true);
    });

  // logs command
  help.add('logs', function() {
    this.line('project logs'.verbose);
    this.line('Gets logs for the selected project.'.input);
    this.line('  options:'.input);
    this.line('    -p, --project-name   Name of the project to retrieve logs from. Prompts are skipped when specified.'.input);
    this.line('    -d, --download       Flag that signals to download the logs instead of printing them.'.input);
    this.line('    -o, --output         Specifies the file to download to. Must be file type tar.gz'.input);
    this.line('');
  });


  //help for logs clear command
  help.add('logClear', function() {
    this.line('project logs clear'.verbose);
    this.line('Cleans logs for the selected project.'.input);
  });

  modulus.program
    .command('project logs')
    .description('Gets logs for the selected project.')
    .on('--help', function() {
      help.commands.logs();
      help.commands.logClear()
    })
    .action(function(dir){
      modulus.runCommand(modulus.commands.project.getLogs, [modulus.program.projectName, modulus.program.download, modulus.program.output, dir], true);
    });

  // project logs -> logs alias
  modulus.program
    .command('logs')
    .description('Gets logs for the selected project.')
    .on('--help', function() {
      help.commands.logs();
      help.commands.logClear()
    })
    .action(function(dir){
      modulus.runCommand(modulus.commands.project.getLogs, [modulus.program.projectName, modulus.program.download, modulus.program.output, dir], true);
    });

  // log clear command
  modulus.program
    .command('project logs clear')
    .description('Clears logs for the selected project.')
    .on('--help', help.commands.logClear)
    .action(function(dir){
      modulus.runCommand(modulus.commands.project.clearLogs, [modulus.program.projectName], true);
    });

  // project logs clear -> logs clear alias
  modulus.program
    .command('logs clear')
    .description('Clears logs for the selected project.')
    .on('--help', help.commands.logClear)
    .action(function(dir){
      modulus.runCommand(modulus.commands.project.clearLogs, [modulus.program.projectName], true);
    });

  // log stream command
  help.add('logStream', function() {
    this.line('project logs tail'.verbose);
    this.line('Streams logs for the selected project.'.input);
  });

  modulus.program
    .command('project logs tail')
    .description('Streams logs for the selected project.')
    .on('--help', help.commands.logStream)
    .action(function(dir){
      modulus.runCommand(modulus.commands.project.streamLogs, [modulus.program.projectName], true);
    });

  // project logs tail -> logs tail alias
  modulus.program
    .command('logs tail')
    .description('Streams logs for the selected project.')
    .on('--help', help.commands.logStream)
    .action(function(dir){
      modulus.runCommand(modulus.commands.project.streamLogs, [modulus.program.projectName], true);
    });

  // scale command
  help.add('scale', function() {
    this.line('project scale <servos>'.verbose);
    this.line('Scales a project to use the number of servos given.'.input);
  });

  modulus.program
    .command('project scale')
    .description('Scales a project to the number of servos specified.')
    .on('--help', help.commands.scale)
    .action(function(){
      var args = [];
      for(var key in arguments) {
        args.push(arguments[key]);
      }
      args.pop(); // remove last element, it's always internal commander stuff.
      modulus.runCommand(modulus.commands.project.scale, [args], true);
    });

  // Generic help for project commands
  modulus.program
    .command('project')
    .description('Lists available project commands.')
    .on('--help', help.getPrinter())
    .action(help.getPrinter());

  return {
    base : 'project',
    help : help
  };
};