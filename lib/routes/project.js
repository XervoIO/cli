module.exports = function(modulus) {
  modulus.program
    .command('project list')
    .description('Lists all projects you currently have access to.')
    .action(function(){
      modulus.runCommand(modulus.commands.project.list, true);
    });

  modulus.program
    .command('list')
    .description('Lists all projects you currently have access to.')
    .action(function(){
      modulus.runCommand(modulus.commands.project.list, true);
    });

  modulus.program
    .command('project create')
    .description('Creates a new project.')
    .action(function(){
      modulus.runCommand(modulus.commands.project.create, true);
    });

  modulus.program
    .command('project deploy')
    .description('Deploys the current directory to selected project.')
    .action(function(){
      modulus.runCommand(modulus.commands.project.deploy, true);
    });

  modulus.program
    .command('deploy')
    .description('Deploys the current directory to selected project.')
    .action(function(){
      modulus.runCommand(modulus.commands.project.deploy, true);
    });

  modulus.program
    .command('project')
    .description('Lists available project commands.')
    .action(function(){
      help();
    });
};

var help = function() {
  modulus.io.print('  project list (list)'.verbose);
  modulus.io.print('  Lists all projects you currently have access to.'.input);
  modulus.io.print(' ');
  modulus.io.print('  project create'.verbose);
  modulus.io.print('  Creates a new project.'.input);
  modulus.io.print(' ');
  modulus.io.print('  project deploy (deploy)'.verbose);
  modulus.io.print('  Deploys the current directory to selected project.'.input);
};

module.exports.help = help;