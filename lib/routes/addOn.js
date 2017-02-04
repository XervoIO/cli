module.exports = function (xervo) {
  var help = new xervo.help('Add-Ons', xervo)

  // Get Project AddOns
  help.add('list', function () {
    this.line('addons list'.verbose)
    this.line('View all the add-ons currently provisioned for a project.'.input)
    this.line('    -p, --project-name   Name of the project to retrieve add-ons for. Prompts are skipped when specified.'.input)
  })

  xervo.program
    .command('addons list')
    .description('Lists all the add-ons currently provisioned for the project.')
    .on('--help', help.commands.list)
    .action(function () {
      xervo.runCommand(xervo.commands.addons.getForProject, [xervo.program.projectName], true)
    })

  // Provision an Add-On
  help.add('provision', function () {
    this.line('addons add [options] <addon:plan>'.verbose)
    this.line('Provisions an add-on to a project.'.input)
    this.line('    -p, --project-name   Name of the project to provision the add-on for. Prompts are skipped when specified.'.input)
  })

  xervo.program
    .command('addons add')
    .description('Provisions an add-on for your project.')
    .on('--help', help.commands.provision)
    .action(function (addon) {
      xervo.runCommand(xervo.commands.addons.provision, [xervo.program.projectName, addon], true)
    })

  // Deprovision an Add-On
  help.add('deprovision', function () {
    this.line('addons remove [options] <addonId>'.verbose)
    this.line('Deprovisions an add-on from a project.'.input)
    this.line('You will be prompted to choose an Add-On if an addonId is not provided.'.input)
    this.line('    -p, --project-name   Name of the project to deprovision the add-on from. Prompts are skipped when specified.'.input)
  })

  xervo.program
    .command('addons remove')
    .description('Deprovisions an add-on from your project.')
    .on('--help', help.commands.provision)
    .action(function (addOnId) {
      xervo.runCommand(xervo.commands.addons.deprovision, [xervo.program.projectName, addOnId], true)
    })

  return {
    base: 'addons',
    help: help
  }
}
