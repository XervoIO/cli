module.exports = function(xervo) {
  var help = new xervo.help('Environment Variables', xervo);

  // list command
  help.add('list', function() {
    this.line('env list'.verbose);
    this.line('Lists all environment variables for a project.'.input);
    this.line('    -p, --project-name    Name of the project to list environment variables for.'.input);
  });

  xervo.program
    .command('env list')
    .description('Lists all environment variables for a project.')
    .on('--help', help.commands.list)
    .action(function () {
      xervo.runCommand(xervo.commands.env.list, [xervo.program.projectName], true);
    });

  // set command
  help.add('set', function() {
    this.line('env set <name> <value>'.verbose);
    this.line('Sets a environment variable for a project.'.input);
    this.line('  options:'.input);
    this.line('    -p, --project-name    Name of the project to set an environment variable for.'.input);
  });

  xervo.program
    .command('env set','<name> <value>')
    .description('Sets an environment variable for a project.')
    .on('--help', help.commands.set)
    .action(function(name, value){
      xervo.runCommand(xervo.commands.env.set, [xervo.program.projectName, name, value], true);
    });

  // export command
  help.add('export', function() {
    this.line('env export <file>'.verbose);
    this.line('Export environment variables for a project into a JSON file.'.input);
    this.line('  options:'.input);
    this.line('    -p, --project-name    Name of the project to export environment variables for.'.input);
  });

  xervo.program
    .command('env export','<file>')
    .description('Export environment variables for a project into a JSON file.')
    .on('--help', help.commands.export)
    .action(function(file){
      xervo.runCommand(xervo.commands.env.export, [xervo.program.projectName, file], true);
    });

  // load command
  help.add('load', function() {
    this.line('env load <file>'.verbose);
    this.line('Set environment variables for a project using data loaded from a JSON file.'.input);
    this.line('  options:'.input);
    this.line('    -p, --project-name    Name of the project to load environment variables for.'.input);
  });

  xervo.program
    .command('env load','<file>')
    .description('Set environment variables for a project using data loaded from a JSON file.')
    .on('--help', help.commands.set)
    .action(function(file){
      xervo.runCommand(xervo.commands.env.load, [xervo.program.projectName, file], true);
    });

  // get command
  help.add('get', function() {
    this.line('env get <name>'.verbose);
    this.line('Gets an environment variable for a project.'.input);
    this.line('  options:'.input);
    this.line('    -p, --project-name    Name of the project to get an environment variable for.'.input);
  });

  xervo.program
    .command('env get','<name>')
    .description('Gets an environment variable for a project.')
    .on('--help', help.commands.get)
    .action(function(name){
      xervo.runCommand(xervo.commands.env.get, [xervo.program.projectName, name], true);
    });

  // delete command
  help.add('delete', function() {
    this.line('env delete <name>'.verbose);
    this.line('Removes an environment variable for a project.'.input);
    this.line('  options:'.input);
    this.line('    -p, --project-name    Name of the project to delete an environment variable from.'.input);
  });

  xervo.program
    .command('env delete','<name>')
    .description('Removes an environment variable for a project.')
    .on('--help', help.commands.delete)
    .action(function(name){
      xervo.runCommand(xervo.commands.env.delete, [xervo.program.projectName, name], true);
    });

  // Generic help for env commands
  xervo.program
    .command('env')
    .description('Lists available env commands.')
    .on('--help', help.getPrinter())
    .action(help.getPrinter());

  return {
    base : 'env',
    help : help
  };
};
