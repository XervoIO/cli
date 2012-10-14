module.exports = function(modulus) {
  modulus.program
    .command('project create')
    .description('Create a new project.')
    .action(function(){
      modulus.runCommand(modulus.commands.project.create, true);
    });

  modulus.program
    .command('project deploy')
    .description('Deploy current directory to project.')
    .action(function(){
      modulus.runCommand(modulus.commands.project.deploy, true);
    });

  modulus.program
    .command('deploy')
    .description('Deploy current directory to project.')
    .action(function(){
      modulus.runCommand(modulus.commands.project.deploy, true);
    });

  modulus.program
    .command('project')
    .description('Output project commands.')
    .action(function(){
      modulus.io.print('Commands for modulus project are:');
    });
};