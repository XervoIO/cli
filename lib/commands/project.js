var modulus = require('../modulus'),
    librarian = require('../common/api').librarian,
    async = require('async'),
    userConfig = require('../common/api').userConfig,
    error = require('../common/error'),
    zipstream = require('zipstream'),
    walkFiles = require('walkr'),
    fs = require('fs');

var project = {};

project.create = function(cb) {
  async.parallel([
    function(callback) {
      librarian.user.get(userConfig.data.userId, callback);
    },
    function(callback) {
      librarian.project.find({userId : userConfig.data.userId}, callback);
    }],
    function(err, results) {
      if(err) {
        return error.handleApiError(err, cb);
      }

      var user = results[0],
          projects = results[1];

      if (user.status === 'BETA_LOCKED') {
        return cb('You can not create projects at this time. You need to have a beta unlocked account.');
      }

      if (parseInt(user.projectLimit, 10) === projects.length) {
        return cb('You can not create any more projects at this time. You have reached your project limit.');
      }

      project._createProjectPrompt(function(err, name) {
        if(err) {
          return cb('Could not create project.');
        }
        librarian.project.create({
          name: name,
          creator: user.id
        }, function(err, project) {
          if(err) {
            return error.handleApiError(err, cb);
          }
          if(!project) {
            return cb('Could not create project. Error from server.');
          }
          modulus.io.success('New project ' + name.data + ' created.');
          return cb();
        });
      });
  });
};

project.deploy = function(cb) {
  librarian.project.find({
      userId : userConfig.data.userId
    },
    function(err, projects) {
      if(err) {
        return error.handleApiError(err, cb);
      }
      if(projects.length === 0) {
         modulus.io.error('You currently have no projects. Please create one on the website');
         return cb();
      }
      project.chooseProjectPrompt(projects, function(err, result) {
        if(err) {
          return cb('Could not deploy project.');
        }
        if(!result) {
          return cb('You must deploy to a project.');
        }
        // Check for package.json and app.js
        // Check if package.json is correctly formatted
        // Zip of files, when zipping exclude .DS_Store, __MACOSX
        // Send zip file stream to server
        project._packageProject(process.cwd(), cb);
      });
  });
};

project._createProjectPrompt = function(cb) {
  modulus.io.prompt.get([{
    name : 'name',
    description : 'Enter a project name:',
    maxLength : 50,
    required : true
  }], function(err, results) {
    if(err) {
      return error.handlePromptError(err, cb);
    }
    cb(null, results.name);
  });
};

project.chooseProjectPrompt = function(projects, cb) {
  if(projects.length === 1) {
    var project = projects[0];
    modulus.io.prompt.get([{
      name : 'confirm',
      description : 'Are you sure you want to use project  ' + project.name.data + '?',
      message : 'Acceptable response is "yes" or "no".',
      pattern : /^[yntf]{1}/i,
      default : 'yes'
    }], function(err, result) {
      if(err) {
        return error.handlePromptError(err, cb);
      }
      var y = /^[yt]{1}/i.test(result.confirm);
      var p = y ? project : null;
      return cb(null, p);
    });
  } else {
    modulus.io.print('Please choose which project to use:'.input);
    for(var i = 0, len = projects.length; i < len; i++) {
      var index = i + 1;
      modulus.io.print(index.input + ') '.input + projects[i].name.input);
    }
    modulus.io.prompt.get([{
      name : 'project',
      description : 'Project Number?',
      warning : 'Project number has to be between 1 and ' + projects.length,
      type : 'integer',
      minimum : 1,
      maximum : projects.length
    }], function(err, result) {
      if(err) {
        return error.handlePromptError(err, cb);
      }
      return cb(null, projects[result.project - 1]);
    });
  }
};

project._packageProject = function(dir, cb) {
  var out = fs.createWriteStream('out.zip');
  var zip = zipstream.createZip({ level: 1 });

  zip.pipe(out);

  // TODO : better exclude mechinism
  walkFiles(dir).
  filter(/^\.git/).
  filterDir(/node_modules/).
  filterDir(/__MACOSX/).
  filterFile(function(ops, next) {
    if(ops.name === 'out.zip') {
      return next();
    }

    var rel = ops.source.replace(dir, '.');

    zip.addFile(fs.createReadStream(ops.source), {name: rel}, function() {
      next();
    });
  }).
  start(function(err) {
    zip.finalize(function(written) {
      console.log(written + ' total bytes written');
      return cb();
    });
  });
};

module.exports = project;