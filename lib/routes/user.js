module.exports = function(modulus) {
  modulus.program
    .command('signup')
    .description('Sign up for an account on Modulus')
    .action(function(){
      modulus.runCommand(modulus.commands.user.signup);
    });

  modulus.program
    .command('login')
    .description('Log into an account on Modulus')
    .action(function(){
      modulus.runCommand(modulus.commands.user.login);
    });

  modulus.program
    .command('logout')
    .description('Log out of current account on Modulus')
    .action(function(){
      modulus.runCommand(modulus.commands.user.logout, true);
    });

  modulus.program
    .command('unlock')
    .description('Unlock the current account on Modulus')
    .action(function(){
      modulus.runCommand(modulus.commands.user.unlock, true);
    });

  modulus.program
    .command('resetPassword')
    .description('Resets password for an account on Modulus')
    .action(function(){
      modulus.runCommand(modulus.commands.user.resetPassword);
    });
};