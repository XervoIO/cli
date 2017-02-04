module.exports = function (xervo) {
  var help = new xervo.help('Configuration', xervo)

  help.add('get', function () {
    this.line('config get <name>'.verbose)
    this.line('Get a configuration value.'.input)
  })

  xervo.program
    .command('config get', '<name>')
    .description('Get a configuration value.')
    .on('--help', help.commands.get)
    .action(function (name) {
      xervo.runCommand(xervo.commands.config.get, [name], false)
    })

  help.add('set', function () {
    this.line('config set <name> <value>'.verbose)
    this.line('Set a configuration value.'.input)
  })

  xervo.program
    .command('config set', '<name> <value>')
    .description('Set a configuration value.')
    .on('--help', help.commands.set)
    .action(function (name, value) {
      xervo.runCommand(xervo.commands.config.set, [name, value], false)
    })

  return { base: 'config', help: help }
}
