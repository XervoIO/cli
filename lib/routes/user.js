/*
 * Copyright (c) 2014 Modulus
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 */

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
    this.line('  options:'.input);
    this.line('    --username      The username to log in with.'.input);
    this.line('    --password      The password to use when logging in.'.input);
    this.line('    -g, --github    Log in using your GitHub credentials.'.input);
  });

  modulus.program
    .option('-u, --username [value]', 'The username to log in with.')
    .option('-P, --password [value]', 'The password to use when logging in.')
    .option('-g, --github', 'Log in using your GitHub credentials.');

  modulus.program
    .command('login')
    .description('Log into an account.')
    .on('--help', help.commands.login)
    .action(function() {
      modulus.runCommand(modulus.commands.user.login, [
        modulus.program.username,
        modulus.program.password,
        typeof modulus.program.github === 'undefined' ? false : modulus.program.github
      ]);
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

  // Create auth token
  help.add('createToken', function() {
    this.line('token create'.verbose);
    this.line('Create an API token.'.input);
  });

  modulus.program
    .command('token create')
    .description('Create an API token')
    .on('--help', help.commands.createToken)
    .action(function(){
      modulus.runCommand(modulus.commands.user.createToken, true);
    });

  // List auth tokens
  help.add('listTokens', function() {
    this.line('token list'.verbose);
    this.line('List your API tokens.'.input);
  });

  modulus.program
    .command('token list')
    .description('List your API tokens. ')
    .on('--help', help.commands.listTokens)
    .action(function(){
      modulus.runCommand(modulus.commands.user.listTokens, true);
    });

  // List auth tokens
  help.add('removeToken', function() {
    this.line('token remove <token>'.verbose);
    this.line('Removes an API token.'.input);
  });

  modulus.program
    .command('token remove')
    .description('Removes an API token. ')
    .on('--help', help.commands.removeToken)
    .action(function(value){
      modulus.runCommand(modulus.commands.user.removeToken, [value], true);
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

  var brohoof = function() {
    modulus.io.print('');
    modulus.io.print('                                                       =');
    modulus.io.print('                                                       =,');
    modulus.io.print('                                                        =, ,====');
    modulus.io.print('                            =IIII+==?               +IIII+=======');
    modulus.io.print('                        ? ===========             +??II?III+=======');
    modulus.io.print('                       ?I?~~~=~=====,=            +I?IIIIIII==++====');
    modulus.io.print('                       IIIIII========,:          ?IIIII??+++++++=====');
    modulus.io.print('                       IIIIIIIII=I=====        +?II???++++++++++====');
    modulus.io.print('                       IIIIIIIIIII+I  :=           + ?+++++++++====');
    modulus.io.print('                       ~IIII~7~7~ II              :+?  7~7+++++====');
    modulus.io.print('         ,~:           ~=~III7?   II?=           ++++   I+++++?===~');
    modulus.io.print('      ~:~=======        ====IIIIIIII+             =+++++++?+II  ==     ??+');
    modulus.io.print('    =:====IIII?II~      ====?IIII?:                 ~+++??IIII  =   +?IIIIII+');
    modulus.io.print('     ====II===~~=+~      ====I+                        +IIIIII     ?IIIIIIIII?');
    modulus.io.print('     :==II==~~   ,I?+II+ =:===I                    ??I?IIIIIII++++??I?IIIIIIII?');
    modulus.io.print('    =~==I==~~    I7?+?IIII=:=+I        ,II=++~     III~?IIIII++++++~    IIIII?I');
    modulus.io.print('    ====I=~~     III?II+III=:I? ,++IIIIIII++++++++?+II?+??I?+++++===    =IIIIII');
    modulus.io.print('    :==?I=~~     II+??IIIIII=IIIIIIIIIIIII=+++++++++??+?+++++++++++=    ?IIIIII+');
    modulus.io.print('    :==?I=~=     :II?IIIII+I?==+++==~:     ========~:  =++++++++=++    :IIIIIII~');
    modulus.io.print('   ~:==I+~=     ?III+?   =???                            ==++===+++:   I?IIIIII');
    modulus.io.print('   =~==I===    ~III+?    +???                              +++ ==+++   IIIIII??');
    modulus.io.print('  , ,==I~==    III??+    ????                              +++:==?+++  ?IIIII?');
    modulus.io.print('    ==~~ =    ~III+?     ????                              +++====+++    +?~??');
    modulus.io.print('  ====  :     +III??     ????+                             +++====+++,   +IIIII');
    modulus.io.print('              ?III??     ?????                            ~+++===++++,   ? II?');
    modulus.io.print('              +III+?+    ~????+                           ++++===++++');
    modulus.io.print('               ~+~                                        :~~,   ,~~~');
    modulus.io.print('');
    modulus.io.print('                                        #bronies');
  };

  modulus.program
    .command('brohoof')
    .description('Here\'s to you, bronies.')
    .on('--help', brohoof)
    .action(brohoof);

  return {
    base : 'user',
    help : help
  };
};