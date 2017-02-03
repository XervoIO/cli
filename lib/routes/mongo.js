module.exports = function(xervo) {
  var help = new xervo.help('MongoDB', xervo);

  // list commands
  help.add('list', function () {
    this.line('mongo list (list)'.verbose);
    this.line('View all mongos you have.'.input);
  });

  xervo.program
    .command('mongo list')
    .description('Lists all mongos you currently have access to.')
    .on('--help', help.commands.list)
    .action(function () {
      xervo.runCommand(xervo.commands.mongo.list, true);
    });

  // create command
  help.add('create', function() {
    this.line('mongo create <name>'.verbose);
    this.line('Creates a new MongoDB database.'.input);
    this.line('A prompt for name will occur if none is specified.'.input);
  });

  xervo.program
    .command('mongo create')
    .description('Creates a new MongoDB database.')
    .on('--help', help.commands.create)
    .action(function(name){
      if(typeof name !== 'string') {
        name = '';
      }
      xervo.runCommand(xervo.commands.mongo.create, [name], true);
    });

  // create command
  help.add('user create', function() {
    this.line('mongo user create'.verbose);
    this.line('Creates a new MongoDB database user.'.input);
  });

  xervo.program
    .command('mongo user create')
    .description('Creates a new MongoDB database user.')
    .on('--help', help.commands.create)
    .action(function(){
      var dbName = '',
          username = '',
          password = '',
          isReadOnly = '';
      xervo.runCommand(xervo.commands.mongo.createUser, [dbName, username, password, isReadOnly], true);
    });

  // Generic help for mongo commands
  xervo.program
    .command('mongo')
    .description('Lists available mongo commands.')
    .on('--help', help.getPrinter())
    .action(help.getPrinter());

  return {
    base : 'mongo',
    help : help
  };
};
