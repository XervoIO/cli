module.exports = function(xervo) {
  var help = new xervo.help('Status', xervo);

  // default command
  help.add('status', function() {
    this.line('status'.verbose);
    this.line('Displays the status of Xervo.'.input);
  });

  xervo.program
    .command('status')
    .description('Displays the status of Xervo.')
    .on('--help', help.commands.status)
    .action(function (){
      xervo.runCommand(xervo.commands.status.get, true);
    });

  return {
    base : 'status',
    help : help
  };
};
