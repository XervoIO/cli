module.exports = function(modulus) {
  var help = new modulus.help('User', modulus);

  // signup command
  help.add('signup', function() {
    this.line('signup'.verbose);
    this.line('Register as a new Modulus user.'.input);
  });

  modulus.program
    .command('signup')
    .description('Sign up for an account.')
    .on('--help', help.commands.signup)
    .action(function(){
      modulus.runCommand(modulus.commands.user.signup);
    });

  // login command
  help.add('login', function() {
    this.line('login'.verbose);
    this.line('Log in to your Modulus account.'.input);
  });

  modulus.program
    .command('login')
    .description('Log into an account.')
    .on('--help', help.commands.login)
    .action(function(){
      modulus.runCommand(modulus.commands.user.login);
    });

  help.add('loginGithub', function() {
    this.line('login github'.verbose);
    this.line('Log in to your Modulus account using your GitHub credentials.'.input);
  });

  modulus.program
    .command('login github')
    .description('Log into an account using your GitHub credentials.')
    .on('--help', help.commands.loginGithub)
    .action(function(){
      modulus.runCommand(modulus.commands.user.loginGithub);
    });

  // logout command
  help.add('logout', function() {
    this.line('logout'.verbose);
    this.line('Log out of your current session.'.input);
  });

  modulus.program
    .command('logout')
    .description('Log out of current account.')
    .on('--help', help.commands.logout)
    .action(function(){
      modulus.runCommand(modulus.commands.user.logout, true);
    });

  // resetPassword command
  help.add('reset', function() {
    this.line('resetPassword'.verbose);
    this.line('Sends a password reset email.'.input);
  });

  modulus.program
    .command('resetPassword')
    .description('Resets password for an account')
    .on('--help', help.commands.reset)
    .action(function(){
      modulus.runCommand(modulus.commands.user.resetPassword);
    });

  // Generic help for user commands
  modulus.program
    .command('user')
    .description('Lists available user commands.')
    .on('--help', help.getPrinter())
    .action(help.getPrinter());

  // Some fun helpers for the user
  var coffee = function() {
    modulus.io.print('');
    modulus.io.print('         {');
    modulus.io.print('      }   }   {');
    modulus.io.print('     {   {  }  }');
    modulus.io.print('      }   }{  {');
    modulus.io.print('     {  }{  }  }');
    modulus.io.print('    ( }{ }{  { )');
    modulus.io.print('  .- { { }  { }} -.');
    modulus.io.print(' (  ( } { } { } }  )');
    modulus.io.print(' |`-..________ ..-\'|');
    modulus.io.print(' |                 |');
    modulus.io.print(' |                 ;--.');
    modulus.io.print(' |                (__  \\');
    modulus.io.print(' |                 | )  )');
    modulus.io.print(' |                 |/  /');
    modulus.io.print(' |                 (  /');
    modulus.io.print(' |                 y\'');
    modulus.io.print(' |                 |');
    modulus.io.print('  `-.._________..-\'');
    modulus.io.print('');
    modulus.io.print(' Now Get Back to Work.');
  };

  modulus.program
    .command('coffee')
    .description('Make the user a cup of coffee.')
    .on('--help', coffee)
    .action(coffee);

  modulus.program
    .command('make coffee')
    .description('Make the user a cup of coffee.')
    .on('--help', coffee)
    .action(coffee);

  var beer = function() {
    modulus.io.print('');
    modulus.io.print('            ~  ~');
    modulus.io.print('           ( o )o)');
    modulus.io.print('          ( o )o )o)');
    modulus.io.print('       (o( ~~~~~~~~o');
    modulus.io.print('       ( )\' ~~~~~~~\'');
    modulus.io.print('        ( )|)      |-.');
    modulus.io.print('         o|        |-. \\');
    modulus.io.print('         o|        |  \\ \\');
    modulus.io.print('          |        |   | |');
    modulus.io.print('         o|        |  / /');
    modulus.io.print('          |        |." "');
    modulus.io.print('          |        |- \'');
    modulus.io.print('          .========.');
    modulus.io.print('');
    modulus.io.print('May the Ballmer Peak be with you.');
  };

  modulus.program
    .command('beer')
    .description('Ill go get a beer for ya.')
    .on('--help', beer)
    .action(beer);

  modulus.program
    .command('get beer')
    .description('Ill go get a beer for ya.')
    .on('--help', beer)
    .action(beer);


  return {
    base : 'user',
    help : help
  };
};