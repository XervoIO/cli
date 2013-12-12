module.exports = function(modulus) {
  var help = new modulus.help('Configuration', modulus);

  help.add('list', function() {
    this.line('config list'.verbose);
    this.line('List all configuration values for the Modulus CLI'.input);
  });

  modulus.program
    .command('config get', '<name>')
    .description('Get configuration value for the configuration name')
    .on('--help', help.commands.list)
    .action(function(name) {
      modulus.runCommand(modulus.commands.config.get, [name], true);
    });

  help.add('set', function() {
    this.line('config set'.verbose);
    this.line('Set a configuration value'.input);
  });

  modulus.program
    .command('config set', '<name> <value>')
    .description('Set a configuration value')
    .on('--help', help.commands.set)
    .action(function(name, value) {
      modulus.runCommand(modulus.commands.config.set, [name, value], true);
    });

  return { base: 'config', help: help };
};
