module.exports = function (xervo) {
  var help = new xervo.help('User', xervo)

  // login command
  help.add('login', function () {
    this.line('login'.verbose)
    this.line('Log in to your Xervo account.'.input)
    this.line('  options:'.input)
    this.line('    --username      The username to log in with.'.input)
    this.line('    --password      The password to use when logging in.'.input)
    this.line('    -g, --github    Log in using your GitHub credentials.'.input)
  })

  xervo.program
    .option('-u, --username [value]', 'The username to log in with.')
    .option('-P, --password [value]', 'The password to use when logging in.')
    .option('-g, --github', 'Log in using your GitHub credentials.')

  xervo.program
    .command('login')
    .description('Log into an account.')
    .on('--help', help.commands.login)
    .action(function () {
      xervo.runCommand(xervo.commands.user.login, [
        xervo.program.username,
        xervo.program.password,
        typeof xervo.program.github === 'undefined' ? false : xervo.program.github
      ])
    })

  // logout command
  help.add('logout', function () {
    this.line('logout'.verbose)
    this.line('Log out of your current session.'.input)
  })

  xervo.program
    .command('logout')
    .description('Log out of current account.')
    .on('--help', help.commands.logout)
    .action(function () {
      xervo.runCommand(xervo.commands.user.logout, true)
    })

  // resetPassword command
  help.add('reset', function () {
    this.line('resetPassword'.verbose)
    this.line('Sends a password reset email.'.input)
  })

  xervo.program
    .command('resetPassword')
    .description('Resets password for an account')
    .on('--help', help.commands.reset)
    .action(function () {
      xervo.runCommand(xervo.commands.user.resetPassword)
    })

  // Create auth token
  help.add('createToken', function () {
    this.line('token create'.verbose)
    this.line('Create an API token.'.input)
  })

  xervo.program
    .command('token create')
    .description('Create an API token')
    .on('--help', help.commands.createToken)
    .action(function () {
      xervo.runCommand(xervo.commands.user.createToken, true)
    })

  // List auth tokens
  help.add('listTokens', function () {
    this.line('token list'.verbose)
    this.line('List your API tokens.'.input)
  })

  xervo.program
    .command('token list')
    .description('List your API tokens. ')
    .on('--help', help.commands.listTokens)
    .action(function () {
      xervo.runCommand(xervo.commands.user.listTokens, true)
    })

  // List auth tokens
  help.add('removeToken', function () {
    this.line('token remove <token>'.verbose)
    this.line('Removes an API token.'.input)
  })

  xervo.program
    .command('token remove')
    .description('Removes an API token. ')
    .on('--help', help.commands.removeToken)
    .action(function (value) {
      xervo.runCommand(xervo.commands.user.removeToken, [value], true)
    })

  // Generic help for user commands
  xervo.program
    .command('user')
    .description('Lists available user commands.')
    .on('--help', help.getPrinter())
    .action(help.getPrinter())

  // Some fun helpers for the user
  var coffee = function () {
    xervo.io.print('')
    xervo.io.print('         {')
    xervo.io.print('      }   }   {')
    xervo.io.print('     {   {  }  }')
    xervo.io.print('      }   }{  {')
    xervo.io.print('     {  }{  }  }')
    xervo.io.print('    ( }{ }{  { )')
    xervo.io.print('  .- { { }  { }} -.')
    xervo.io.print(' (  ( } { } { } }  )')
    xervo.io.print(' |`-..________ ..-\'|')
    xervo.io.print(' |                 |')
    xervo.io.print(' |                 ;--.')
    xervo.io.print(' |                (__  \\')
    xervo.io.print(' |                 | )  )')
    xervo.io.print(' |                 |/  /')
    xervo.io.print(' |                 (  /')
    xervo.io.print(' |                 y\'')
    xervo.io.print(' |                 |')
    xervo.io.print('  `-.._________..-\'')
    xervo.io.print('')
    xervo.io.print(' Now Get Back to Work.')
  }

  xervo.program
    .command('coffee')
    .description('Make the user a cup of coffee.')
    .on('--help', coffee)
    .action(coffee)

  xervo.program
    .command('make coffee')
    .description('Make the user a cup of coffee.')
    .on('--help', coffee)
    .action(coffee)

  var beer = function () {
    xervo.io.print('')
    xervo.io.print('            ~  ~')
    xervo.io.print('           ( o )o)')
    xervo.io.print('          ( o )o )o)')
    xervo.io.print('       (o( ~~~~~~~~o')
    xervo.io.print('       ( )\' ~~~~~~~\'')
    xervo.io.print('        ( )|)      |-.')
    xervo.io.print('         o|        |-. \\')
    xervo.io.print('         o|        |  \\ \\')
    xervo.io.print('          |        |   | |')
    xervo.io.print('         o|        |  / /')
    xervo.io.print('          |        |." "')
    xervo.io.print('          |        |- \'')
    xervo.io.print('          .========.')
    xervo.io.print('')
    xervo.io.print('May the Ballmer Peak be with you.')
  }

  xervo.program
    .command('beer')
    .description('Ill go get a beer for ya.')
    .on('--help', beer)
    .action(beer)

  xervo.program
    .command('get beer')
    .description('Ill go get a beer for ya.')
    .on('--help', beer)
    .action(beer)

  var brohoof = function () {
    xervo.io.print('')
    xervo.io.print('                                                       =')
    xervo.io.print('                                                       =,')
    xervo.io.print('                                                        =, ,====')
    xervo.io.print('                            =IIII+==?               +IIII+=======')
    xervo.io.print('                        ? ===========             +??II?III+=======')
    xervo.io.print('                       ?I?~~~=~=====,=            +I?IIIIIII==++====')
    xervo.io.print('                       IIIIII========,:          ?IIIII??+++++++=====')
    xervo.io.print('                       IIIIIIIII=I=====        +?II???++++++++++====')
    xervo.io.print('                       IIIIIIIIIII+I  :=           + ?+++++++++====')
    xervo.io.print('                       ~IIII~7~7~ II              :+?  7~7+++++====')
    xervo.io.print('         ,~:           ~=~III7?   II?=           ++++   I+++++?===~')
    xervo.io.print('      ~:~=======        ====IIIIIIII+             =+++++++?+II  ==     ??+')
    xervo.io.print('    =:====IIII?II~      ====?IIII?:                 ~+++??IIII  =   +?IIIIII+')
    xervo.io.print('     ====II===~~=+~      ====I+                        +IIIIII     ?IIIIIIIII?')
    xervo.io.print('     :==II==~~   ,I?+II+ =:===I                    ??I?IIIIIII++++??I?IIIIIIII?')
    xervo.io.print('    =~==I==~~    I7?+?IIII=:=+I        ,II=++~     III~?IIIII++++++~    IIIII?I')
    xervo.io.print('    ====I=~~     III?II+III=:I? ,++IIIIIII++++++++?+II?+??I?+++++===    =IIIIII')
    xervo.io.print('    :==?I=~~     II+??IIIIII=IIIIIIIIIIIII=+++++++++??+?+++++++++++=    ?IIIIII+')
    xervo.io.print('    :==?I=~=     :II?IIIII+I?==+++==~:     ========~:  =++++++++=++    :IIIIIII~')
    xervo.io.print('   ~:==I+~=     ?III+?   =???                            ==++===+++:   I?IIIIII')
    xervo.io.print('   =~==I===    ~III+?    +???                              +++ ==+++   IIIIII??')
    xervo.io.print('  , ,==I~==    III??+    ????                              +++:==?+++  ?IIIII?')
    xervo.io.print('    ==~~ =    ~III+?     ????                              +++====+++    +?~??')
    xervo.io.print('  ====  :     +III??     ????+                             +++====+++,   +IIIII')
    xervo.io.print('              ?III??     ?????                            ~+++===++++,   ? II?')
    xervo.io.print('              +III+?+    ~????+                           ++++===++++')
    xervo.io.print('               ~+~                                        :~~,   ,~~~')
    xervo.io.print('')
    xervo.io.print('                                        #bronies')
  }

  xervo.program
    .command('brohoof')
    .description('Here\'s to you, bronies.')
    .on('--help', brohoof)
    .action(brohoof)

  return {
    base: 'user',
    help: help
  }
}
