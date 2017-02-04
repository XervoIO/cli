module.exports = function (xervo) {
  var help = new xervo.help('Servo', xervo)

  // list command
  help.add('list', function () {
    this.line('servo list'.verbose)
    this.line('View all servos you have.'.input)
    this.line('  options:'.input)
    this.line('    -p, --project-name   Name of the project whose servos you want to view.'.input)
  })

  xervo.program
    .command('servo list')
    .description('Lists all servos you currently have access to.')
    .on('--help', help.commands.list)
    .action(function () {
      xervo.runCommand(xervo.commands.servo.list, [xervo.program.projectName], true)
    })

  // restart command
  help.add('restart', function () {
    this.line('servo restart'.verbose)
    this.line('Restarts a servo.'.input)
    this.line('  options:'.input)
    this.line('    -i, --servo-id   Id of the servo you want to restart.'.input)
  })

  xervo.program
    .option('-i, --servo-id [id]', 'Id of the servo you want to restart.')

  xervo.program
    .command('servo restart')
    .description('Restarts a running servo.')
    .on('--help', help.commands.restart)
    .action(function () {
      xervo.runCommand(xervo.commands.servo.restart, [xervo.program.servoId], true)
    })

  // Generic help for servo commands
  xervo.program
    .command('servo')
    .description('Lists available servo commands.')
    .on('--help', help.getPrinter())
    .action(help.getPrinter())

  return {
    base: 'servo',
    help: help
  }
}
