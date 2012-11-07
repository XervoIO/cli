module.exports = function(modulus) {
  var help = new modulus.help('Enviroment Variables', modulus);

  // list command
  help.add('list', function() {
    this.line('env list'.verbose);
    this.line('Lists all environment varibles for a project.'.input);
  });

  modulus.program
    .command('env list')
    .description('Lists all environment variables for a project.')
    .on('--help', help.commands.list)
    .action(function(){
      modulus.runCommand(modulus.commands.env.list, true);
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
      modulus.runCommand(modulus.commands.env.set, [name, value], true);
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
      console.log(name);
      process.exit();
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
    });

  modulus.program
    .command('env')
    .description('Output env commands.')
    .action(help);

  return {
    base : 'env',
    help : help
  };
};