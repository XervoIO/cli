module.exports = function(modulus) {
  var help = new modulus.help('Add-Ons', modulus);

  // Get Project AddOns
  help.add('list', function() {
    this.line('addons list'.verbose);
    this.line('View all the Add-Ons currently provisioned for a project.'.input);
    this.line('    -p, --project-name   Name of the project to retrieve Add-Ons for. Prompts are skipped when specified.'.input);
  });

  modulus.program
    .command('addons list')
    .description('Lists all the add-ons currently provisioned for the project.')
    .on('--help', help.commands.list)
    .action(function() {
      modulus.runCommand(modulus.commands.addons.getForProject, [modulus.program.projectName], true);
    });

  return {
    base : 'addons',
    help : help
  };
};