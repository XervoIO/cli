module.exports = function (xervo) {
  var help = new xervo.help('Project', xervo);

  // list commands
  help.add('list', function () {
    this.line('project list (list)'.verbose);
    this.line('View all projects you have.'.input);
  });

  xervo.program
    .command('project list')
    .description('Lists all projects you currently have access to.')
    .on('--help', help.commands.list)
    .action(function () {
      xervo.runCommand(xervo.commands.project.list, true);
    });

  xervo.program
    .command('list')
    .description('Lists all projects you currently have access to.')
    .on('--help', help.commands.list)
    .action(function () {
      xervo.runCommand(xervo.commands.project.list, true);
    });

  // create command
  help.add('create', function () {
    this.line('project create <name>'.verbose);
    this.line('Creates a new project.'.input);
    this.line('A prompt for name will occur if none is specified.'.input);
    this.line('  options:'.input);
    this.line('    -s, --servo-size       Servo size for the new project [192, 396, 512, 1024, 2048].'.input);
    this.line('    -r, --runtime          Runtime for the new project [Node.js, PHP, Java, Static].'.input);
    this.line('    -o, --project-owner    Project owner username or organization name for the project.'.input);
  });

  xervo.program.option(
    '-s, --servo-size [value]',
    'Servo size for the new project [192, 396, 512, 1024, 2048]');

  xervo.program.option(
    '-r, --runtime [value]',
    'Runtime for the new project [Node.js, PHP, Java, Static]');

  xervo.program.option(
    '-o, --project-owner [value]',
    'Project owner for the new project');

  xervo.program
    .command('project create')
    .description('Creates a new project.')
    .on('--help', help.commands.create)
    .action(function (name) {
      if (typeof name !== 'string') {
        name = '';
      }
      xervo.runCommand(
        xervo.commands.project.create,
        [
          name,
          xervo.program.servoSize,
          xervo.program.runtime,
          xervo.program.projectOwner
        ],
        true);
    });

  // delete command
  help.add('delete', function () {
    this.line('project delete'.verbose);
    this.line('Deletes a project.'.input);
    this.line('A prompt for name will occur if none is specified.'.input);
    this.line('  options:'.input);
    this.line('    -p, --project-name    Name of the project to restart. Prompts are skipped when specified.'.input);
  });

  xervo.program
    .command('project delete')
    .description('Deletes a project')
    .on('--help', help.commands.delete)
    .action(function() {
      xervo.runCommand(xervo.commands.project.delete, [xervo.program.projectName], true);
    });

  // resize command
  help.add('resize', function () {
    this.line('project resize'.verbose);
    this.line('Updates a project\'s servo size.'.input);
    this.line('Please note that the project must be stopped and started for the changes to take effect.'.input);
    this.line('  options:'.input);
    this.line('    -p, --project-name    Name of the project to resize. Prompts are skipped when specified.'.input);
    this.line('    -s, --servo-size      Servo size for the project [192, 396, 512, 1024, 2048].'.input);
  });

  xervo.program
    .command('project resize')
    .description('Updates a project\'s servo size.')
    .on('--help', help.commands.resize)
    .action(function () {
      xervo.runCommand(
        xervo.commands.project.resize,
        [
          xervo.program.projectName,
          xervo.program.servoSize
        ],
        true);
    });

  // restart command
  help.add('restart', function () {
    this.line('project restart'.verbose);
    this.line('Restarts a project.'.input);
    this.line('  options:'.input);
    this.line('    -p, --project-name    Name of the project to restart. Prompts are skipped when specified.'.input);
  });

  xervo.program
    .command('project restart')
    .description('Restarts a running project.')
    .on('--help', help.commands.restart)
    .action(function () {
      xervo.runCommand(xervo.commands.project.restart, [xervo.program.projectName], true);
    });

  // stop command
  help.add('stop', function () {
    this.line('project stop'.verbose);
    this.line('Stops a running project'.input);
    this.line('  options:'.input);
    this.line('    -p, --project-name    Name of the project to stop. Prompts are skipped when specified.'.input);
  });

  xervo.program
    .command('project stop')
    .description('Stops a running project.')
    .on('--help', help.commands.stop)
    .action(function () {
      xervo.runCommand(xervo.commands.project.stop, [xervo.program.projectName], true);
    });

  // start command
  help.add('start', function () {
    this.line('project start'.verbose);
    this.line('Starts a project'.input);
    this.line('  options:'.input);
    this.line('    -p, --project-name    Name of the project to start. Prompts are skipped when specified.'.input);
  });

  xervo.program
    .command('project start')
    .description('Starts a stopped project.')
    .on('--help', help.commands.start)
    .action(function () {
      xervo.runCommand(xervo.commands.project.start, [xervo.program.projectName], true);
    });

  // deploy command
  help.add('deploy', function () {
    this.line('project deploy (deploy) [options] <directory>'.verbose);
    this.line('Deploys a directory\'s contents to the selected project.'.input);
    this.line('The current working directory is used if no directory is specified.'.input);
    this.line('By default a project type will be detected and any additional actions required will be taken.'.input);
    this.line('  options:'.input);
    this.line('    -p, --project-name      Name of the project to deploy. Prompts are skipped when specified.'.input);
    this.line('    -m, --include-modules   Flag that indicates whether or not to include the node_modules folder in the bundle.'.input);
    this.line('    -r, --registry          Specify a registry to install modules from.'.input);
    this.line('    -w, --with-tests        Specifies that tests should be run before deploying this project.'.input);
    this.line('        --node-version       Specified version of node to use when running application.'.input);
    this.line('        --npm-version        Specified version of npm to use when building application.'.input);
    this.line('    -d, --debug             Specifies to pass the debug flag to demeteorizer.'.input);
  });

  xervo.program
    .option('-p, --project-name [value]', 'Name of the project to retrieve logs from. Prompts are skipped when specified', null)
    .option('-d, --download', 'Flag that signals to download the logs instead of printing them.')
    .option('-o, --output [value]', 'Specifies the file to download to. Must be file type tar.gz')
    .option('-m, --include-modules', 'Flag that indicates whether or not to include the node_modules folder in the bundle.')
    .option('-r, --registry [value]', 'Specify a registry to install modules from', '')
    .option('-w, --with-tests', 'Specifies that tests should be run before deploying this project.')
    .option('--node-version [value]', 'Specified version of node to use when running application..')
    .option('--npm-version [value]', 'Specified version of npm to use when building application.')
    .option('-d, --debug', 'Specifies to pass the debug flag to demeteorizer.')
    .option('-n, --node-env [value]', 'Specifies node version when running application using `xervo run`.');

  xervo.program
    .command('project deploy')
    .description('Deploys the current directory to selected project.')
    .on('--help', help.commands.deploy)
    .action(function (dir) {
      xervo.runCommand(
        xervo.commands.project.deploy,
        [
          xervo.program.projectName,
          dir,
          xervo.program.includeModules,
          xervo.program.registry,
          xervo.program.withTests,
          xervo.program.nodeVersion,
          xervo.program.npmVersion,
          xervo.program.debug
        ],
        true);
    });

  xervo.program
    .command('deploy')
    .description('Deploys the current directory to selected project.')
    .on('--help', help.commands.deploy)
    .action(function (dir) {
      xervo.runCommand(
        xervo.commands.project.deploy,
        [
          xervo.program.projectName,
          dir,
          xervo.program.includeModules,
          xervo.program.registry,
          xervo.program.withTests,
          xervo.program.nodeVersion,
          xervo.program.npmVersion,
          xervo.program.debug
        ],
        true);
    });

  function deployLogsHandler() {
    xervo.runCommand(
      xervo.commands.project.getDeployLogs,
      [
        xervo.program.projectName
      ],
      true);
  }

  // deployLogs command
  help.add('deployLogs', function () {
    this.line('project deployLogs'.verbose);
    this.line('Gets deploy logs for the selected project.'.input);
    this.line('  options:'.input);
    this.line('    -p, --project-name   Name of the project to retrieve deploy logs from. Prompts are skipped when specified.'.input);
    this.line('');
  });

  xervo.program
    .command('project deployLogs')
    .description('Gets logs for the selected project.')
    .on('--help', function () {
      help.commands.deployLogs();
    })
    .action(deployLogsHandler);

  // project deployLogs -> project deployLog alias
  xervo.program
    .command('project deployLog')
    .description('Gets logs for the selected project.')
    .on('--help', function () {
      help.commands.deployLogs();
    })
    .action(deployLogsHandler);

  // project logs -> logs alias
  xervo.program
    .command('deployLogs')
    .description('Gets logs for the selected project.')
    .on('--help', function () {
      help.commands.deployLogs();
    })
    .action(deployLogsHandler);

  // logs command
  help.add('logs', function () {
    this.line('project logs'.verbose);
    this.line('Gets logs for the selected project.'.input);
    this.line('  options:'.input);
    this.line('    -p, --project-name   Name of the project to retrieve logs from. Prompts are skipped when specified.'.input);
    this.line('    -d, --download       Flag that signals to download the logs instead of printing them.'.input);
    this.line('    -o, --output         Specifies the file to download to. Must be file type tar.gz'.input);
    this.line('');
  });


  // help for logs clear command
  help.add('logClear', function () {
    this.line('project logs clear'.verbose);
    this.line('Cleans logs for the selected project.'.input);
  });

  var logsHandler = function (dir) {
    xervo.runCommand(
      xervo.commands.project.getLogs,
      [
        xervo.program.projectName,
        xervo.program.download,
        xervo.program.output,
        dir
      ],
      true);
  };

  xervo.program
    .command('project logs')
    .description('Gets logs for the selected project.')
    .on('--help', function () {
      help.commands.logs();
      help.commands.logClear();
    })
    .action(logsHandler);

  // project logs -> project log alias
  xervo.program
    .command('project log')
    .description('Gets logs for the selected project.')
    .on('--help', function () {
      help.commands.logs();
      help.commands.logClear();
    })
    .action(logsHandler);

  // project logs -> logs alias
  xervo.program
    .command('logs')
    .description('Gets logs for the selected project.')
    .on('--help', function () {
      help.commands.logs();
      help.commands.logClear();
    })
    .action(logsHandler);

  // log clear command
  xervo.program
    .command('project logs clear')
    .description('Clears logs for the selected project.')
    .on('--help', help.commands.logClear)
    .action(function () {
      xervo.runCommand(xervo.commands.project.clearLogs, [xervo.program.projectName], true);
    });

  // project logs clear -> logs clear alias
  xervo.program
    .command('logs clear')
    .description('Clears logs for the selected project.')
    .on('--help', help.commands.logClear)
    .action(function () {
      xervo.runCommand(xervo.commands.project.clearLogs, [xervo.program.projectName], true);
    });

  // log stream command
  help.add('logStream', function () {
    this.line('project logs tail'.verbose);
    this.line('Streams logs for the selected project.'.input);
    this.line('  options:'.input);
    this.line('    -S, --servo    Index of a specific servo to tail. Prompts are skipped when specified.'.input);
  });

  xervo.program
    .option('-S, --servo [value]', 'Index of a specific servo to tail. Prompts are skipped when specified.');

  xervo.program
    .command('project logs tail')
    .description('Streams logs for the selected project.')
    .on('--help', help.commands.logStream)
    .action(function () {
      xervo.runCommand(xervo.commands.project.streamLogs, [xervo.program.projectName, xervo.program.servo], true);
    });

  // project logs tail -> logs tail alias
  xervo.program
    .command('logs tail')
    .description('Streams logs for the selected project.')
    .on('--help', help.commands.logStream)
    .action(function () {
      xervo.runCommand(xervo.commands.project.streamLogs, [xervo.program.projectName, xervo.program.servo], true);
    });

  // scale command
  help.add('scale', function () {
    this.line('project scale <servos>'.verbose);
    this.line('Scales a project to use the number of servos given.'.input);
    this.line('    -p, --project-name   Name of the project to scale. Prompts are skipped when specified.'.input);
  });

  xervo.program
    .option('-p, --project-name [value]', 'Name of the project to scale. Prompts are skipped when specified');

  xervo.program
    .command('project scale')
    .description('Scales a project to the number of servos specified.')
    .on('--help', help.commands.scale)
    .action(function () {
      var args = Array.prototype.slice.call(arguments);
      args.pop(); // remove last element, it's always internal commander stuff.
      xervo.runCommand(xervo.commands.project.scale, [args, xervo.program.projectName], true);
    });

  help.add('run', function() {
    this.line('project run (run)'.verbose);
    this.line('Run your node application locally with your environment variables.'.input);
    this.line('Please note you must be within your applications root directory.'.input);
    this.line('A main file must be specified in the package.json'.input);
    this.line('  options:'.input);
    this.line('    -p, --project-name    Name of the project to obtain env vars. Prompts are skipped when specified.'.input);
    this.line('    -n, --node-env        Name of the node environment to run the application under. Defaults to "development".'.input);
  });

  xervo.program
    .command('run')
    .description('Run your node application locally with your environment variables. Please note you must be within your applications root directory')
    .on('--help', help.commands.run)
    .action(function(envVars) {
      xervo.runCommand(xervo.commands.project.runApp, [xervo.program.projectName, xervo.program.nodeEnv], true);
    });

  xervo.program
    .command('project run')
    .description('Run your node application locally with your environment variables. Please note you must be within your applications root directory')
    .on('--help', help.commands.run)
    .action(function(envVars) {
      xervo.runCommand(xervo.commands.project.runApp, [xervo.program.projectName, xervo.program.nodeEnv], true);
    });
  help.add('open', function () {
    this.line('project open'.verbose);
    this.line('Opens a project\'s URL in your browser.'.input);
  });

  xervo.program
    .command('project open')
    .description('Open a project\'s URL in your browser.')
    .on('--help', help.commands.open)
    .action(function () {
      xervo.runCommand(xervo.commands.project.open, [xervo.program.projectName], true);
    });

  help.add('download', function () {
    this.line('project download'.verbose);
    this.line('Gets source for the selected project.'.input);
    this.line('  options:'.input);
    this.line('    -p, --project-name   Name of the project to retrieve logs from. Prompts are skipped when specified.'.input);
    this.line('    -o, --output         Specifies the file to download to. Must be file type zip'.input);
    this.line('');
  });

  xervo.program
    .command('project download')
    .description('Gets source for the selected project.')
    .on('--help', function () {
      help.commands.download();
    })
    .action(function () {
      xervo.runCommand(
        xervo.commands.project.download,
        [xervo.program.projectName, xervo.program.output],
        true
      );
    });

  // Generic help for project commands
  xervo.program
    .command('project')
    .description('Lists available project commands.')
    .on('--help', help.getPrinter())
    .action(help.getPrinter());

  return {
    base : 'project',
    help : help
  };
};
