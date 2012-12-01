module.exports = function(modulus) {
  var help = new modulus.help('Miscellaneous', modulus);

  // contact command
  help.add('contact', function() {
    this.line('contact <message>'.verbose);
    this.line('Sends a feedback email to the support team.'.input);
    this.line('Your message must be enclosed in "s (double quotes).'.input);
  });

  modulus.program
    .command('contact', '<message>')
    .description('Sends a feedback email to the support team.')
    .on('--help', help.commands.contact)
    .action(function(message){
      modulus.runCommand(modulus.commands.misc.contact, [message], true);
    });

  return {
    base : 'misc',
    help : help
  };
};