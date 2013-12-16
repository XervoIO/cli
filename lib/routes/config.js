module.exports = function(modulus) {
  var help = new modulus.help('Configuration', modulus);

  help.add('get', function() {
    this.line('config get <name>'.verbose);
    this.line('Get a configuration value.'.input);
  });

  modulus.program
    .command('config get', '<name>')
    .description('Get a configuration value.')
    .on('--help', help.commands.get)
    .action(function(name) {
      modulus.runCommand(modulus.commands.config.get, [name], false);
    });

  help.add('set', function() {
    this.line('config set <name> <value>'.verbose);
    this.line('Set a configuration value.'.input);
  });

  modulus.program
    .command('config set', '<name> <value>')
    .description('Set a configuration value.')
    .on('--help', help.commands.set)
    .action(function(name, value) {
      modulus.runCommand(modulus.commands.config.set, [name, value], false);
    });

  return { base: 'config', help: help };
};
