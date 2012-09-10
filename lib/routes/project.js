module.exports = function(modulus) {
  modulus.program
    .command('deploy')
    .description('Deploy current directory to project on Modulus')
    .action(function(){
      modulus.runCommand(modulus.commands.project.deploy, true);
    });
};