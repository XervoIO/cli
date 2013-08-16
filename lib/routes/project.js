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
    this.line('project create'.verbose);
    this.line('Creates a new project.'.input);
  });

  modulus.program
    .command('project create')
    .description('Creates a new project.')
    .on('--help', help.commands.create)
    .action(function(){
      modulus.runCommand(modulus.commands.project.create, true);
    });

  // restart command
  help.add('restart', function() {
    this.line('project restart'.verbose);
    this.line('Creates a new project.'.input);
  });

  modulus.program
    .command('project restart')
    .description('Restarts a running project.')
    .on('--help', help.commands.create)
    .action(function() {
      modulus.runCommand(modulus.commands.project.restart, true);
    });

  // stop command
  help.add('stop', function() {
    this.line('project stop'.verbose);
    this.line('Stops a running project'.input);
  });

  modulus.program
    .command('project stop')
    .description('Stops a running project.')
    .on('--help', help.commands.create)
    .action(function() {
      modulus.runCommand(modulus.commands.project.stop, true);
    });

  // start command
  help.add('start', function() {
    this.line('project start'.verbose);
    this.line('Starts a running project'.input);
  });

  modulus.program
    .command('project start')
    .description('Starts a stopped project.')
    .on('--help', help.commands.create)
    .action(function() {
      modulus.runCommand(modulus.commands.project.start, true);
    });

  // deploy command
  help.add('deploy', function() {
    this.line('project deploy (deploy) [options] <directory>'.verbose);
    this.line('Deploys a directory\'s contents to the selected project.'.input);
    this.line('The current working directory is used if no directory is specificed.'.input);
    this.line('  options:'.input);
    this.line('    -p, --project-name    Name of the project to deploy. Prompts are skipped when specified.'.input);
    this.line('    -m, --include-modules Flag that indicates whether or not to include the node_modules folder in the bundle.'.input);
  });

  modulus.program
    .option('-p, --project-name [value]', 'Name of the project to retrieve logs from. Prompts are skipped when specified')
    .option('-d, --download', 'Flag that signals to download the logs instead of printing them.')
    .option('-o, --output [value]', 'Specifies the file to download to. Must be file type tar.gz')
    .option('-m, --include-modules', 'Flag that indicates whether or not to include the node_modules folder in the bundle.');

  modulus.program
    .command('project deploy')
    .description('Deploys the current directory to selected project.')
    .on('--help', help.commands.deploy)
    .action(function(dir){
      modulus.runCommand(modulus.commands.project.deploy, [modulus.program.projectName, dir, modulus.program.includeModules], true);
    });

  modulus.program
    .command('deploy')
    .description('Deploys the current directory to selected project.')
    .on('--help', help.commands.deploy)
    .action(function(dir) {
      modulus.runCommand(modulus.commands.project.deploy, [modulus.program.projectName, dir, modulus.program.includeModules], true);
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

  // log clear command
  modulus.program
    .command('project logs clear')
    .description('Cleans logs for the selected project.')
    .on('--help', help.commands.logClear)
    .action(function(dir){
      modulus.runCommand(modulus.commands.project.clearLogs, [modulus.program.projectName], true);
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
    .action(function(instances){
      modulus.runCommand(modulus.commands.project.scale, [instances], true);
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