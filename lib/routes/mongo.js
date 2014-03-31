module.exports = function(modulus) {
  var help = new modulus.help('MongoDB', modulus);

  // create command
  help.add('create', function() {
    this.line('mongo create <name>'.verbose);
    this.line('Creates a new MongoDB database.'.input);
    this.line('A prompt for name will occur if none is specified.'.input);
  });

  modulus.program
    .command('mongo create')
    .description('Creates a new MongoDB database.')
    .on('--help', help.commands.create)
    .action(function(name){
      if(typeof name !== 'string') {
        name = '';
      }
      modulus.runCommand(modulus.commands.mongo.create, [name], true);
    });

  // create command
  help.add('user create', function() {
    this.line('mongo user create'.verbose);
    this.line('Creates a new MongoDB database user.'.input);
  });

  modulus.program
    .command('mongo user create')
    .description('Creates a new MongoDB database user.')
    .on('--help', help.commands.create)
    .action(function(){
      var dbName = '',
          username = '',
          password = '',
          isReadOnly = '';
      modulus.runCommand(modulus.commands.mongo.createUser, [dbName, username, password, isReadOnly], true);
    });

  // Generic help for mongo commands
  modulus.program
    .command('mongo')
    .description('Lists available mongo commands.')
    .on('--help', help.getPrinter())
    .action(help.getPrinter());

  return {
    base : 'mongo',
    help : help
  };
};