module.exports = function(modulus) {
  modulus.program
    .command('env list')
    .description('Lists all environment varibles for project.')
    .action(function(){
      modulus.runCommand(modulus.commands.env.list, true);
    });

  modulus.program
    .command('env set','<name> <value>')
    .description('Sets a environment variable for a project.')
    .action(function(name, value){
      modulus.runCommand(modulus.commands.env.set, [name, value], true);
    });

  modulus.program
    .command('env get','<name>')
    .description('Gets an environment variable for a project.')
    .action(function(name){
      console.log(name);
      process.exit();
    });

  modulus.program
    .command('env delete','<name>')
    .description('Removes an environment variable for a project.')
    .action(function(name){
    });

  modulus.program
    .command('env')
    .description('Output env commands.')
    .action(function(){
      modulus.io.print('Commands for modulus env are:');
      process.exit();
    });
};