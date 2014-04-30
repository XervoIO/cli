<pre>
 __    __   ______   _____    __  __   __       __  __   ______
/\ "-./  \ /\  __ \ /\  __-. /\ \/\ \ /\ \     /\ \/\ \ /\  ___\
\ \ \-./\ \\ \ \/\ \\ \ \/\ \\ \ \_\ \\ \ \____\ \ \_\ \\ \___  \
 \ \_\ \ \_\\ \_____\\ \____- \ \_____\\ \_____\\ \_____\\/\_____\
  \/_/  \/_/ \/_____/ \/____/  \/_____/ \/_____/ \/_____/ \/_____/
</pre>

This is the official command line tool for <a href="https://modulus.io/" target="_blank">Modulus.io</a>. Use it to create and manage your Modulus.io projects. For more detailed descriptions of commands available, check out <a href="https://modulus.io/codex/cli/reference" target="_blank">the Modulus codex</a>.

[![NPM](https://nodei.co/npm/modulus.png)](https://nodei.co/npm/modulus/)

##Installing
To install the Modulus CLI, simply NPM install it globally.

    $ npm install -g modulus

##Usage

Using the CLI is easy.

<pre>
Usage: modulus &lt;command&gt; &lt;param1&gt; &lt;param2&gt;
</pre>

At any point you can run the *help* command to get a full list of commands and how to use them.

You can also send feedback directly to Modulus using the *contact* command. Make sure your message is enclosed in double quotes (eg. “Your message”).

    $ modulus contact "This is feedback from the CLI!"
    Welcome to Modulus
    You are logged in as spiderman
    [√] Feedback sent. Thank you for the message.

##Creating an Account

To start, you may need an account. Using the *signup* command, you can quickly create an account to get things rolling. It will prompt you for a few required pieces of information then set up an account.

    $ modulus signup
    Welcome to Modulus
    In order to sign up we a few pieces of information.
    [?] Choose a username: spiderman
    [?] Enter a valid email: parker@example.com
    [?] Enter a password:
    [√] User spiderman has been created successfully.

    You should receive an email at parker@example.com with more information.

Once you have an account, you need to log in. Running the *login* command will prompt you for your Modulus credentials or if you have linked your GitHub account in the web portal (under account settings) you can use the *--github* flag to login using your GitHub credentials. This keeps a session open so you can run commands under your account and the session will not be closed unless you run the *logout* command or log in with a different account.

    $ modulus login
    Welcome to Modulus
    [?] Enter your username or email: spiderman
    [?] Enter your password:
    [√] Signed in as user spiderman

##Project Management

Once logged in, you are ready to create a project. This is done with the *project create* command, and all that is required is a name.

    $ modulus project create
    Welcome to Modulus
    You are logged in as spiderman
    [?] Enter a project name: Lizard Locator
    [√] New project Lizard Locator created.

You can optionally pass in the name with *project create*.

    $ modulus project create "Lizard Locator"
    Welcome to Modulus
    You are logged in as spiderman
    Creating project Lizard Locator
    [√] New project Lizard Locator created.

To deploy an application to your new project, you can use either the *project deploy* command or its shorter sidekick, *deploy*. This command will take all the contents of your current directory, zip them up and deploy them. Once the deploy has started, the progress will be displayed. When the deploy completes, you have a running application on Modulus. You can redeploy a new version of the project at any time using the same process.

    $ cd my/project/directory
    $ modulus deploy
    Welcome to Modulus
    You are logged in as spiderman
    [?] Are you sure you want to use project Lizard Locator? (yes) yes
    Compressing project...
    2.9 KB written
    Uploading project...
    Upload progress [===================] 100%
    Deploying Project...
    INFO: Attaching persistent storage.
    INFO: Found package.json file: /package.json
    INFO: Node version not specified in package.json, using latest stable version.
    INFO: Initializing Node v0.10.13
    INFO: Running npm install.
    INFO: Registry: http://registry.npmjs.org
    npm http GET http://registry.npmjs.org/express
    npm http 304 http://registry.npmjs.org/express
    npm http GET http://registry.npmjs.org/qs
    npm http GET http://registry.npmjs.org/connect
    npm http GET http://registry.npmjs.org/mime/1.2.4
    npm http GET http://registry.npmjs.org/mkdirp/0.3.0
    npm http 304 http://registry.npmjs.org/qs
    npm http 304 http://registry.npmjs.org/connect
    npm http 304 http://registry.npmjs.org/mime/1.2.4
    npm http 304 http://registry.npmjs.org/mkdirp/0.3.0
    npm http GET http://registry.npmjs.org/mime/-/mime-1.2.4.tgz
    npm http GET http://registry.npmjs.org/mkdirp/-/mkdirp-0.3.0.tgz
    npm http GET http://registry.npmjs.org/qs/-/qs-0.4.2.tgz
    npm http 200 http://registry.npmjs.org/mime/-/mime-1.2.4.tgz
    npm http 200 http://registry.npmjs.org/mkdirp/-/mkdirp-0.3.0.tgz
    npm http 200 http://registry.npmjs.org/qs/-/qs-0.4.2.tgz
    npm http GET http://registry.npmjs.org/formidable
    npm http 304 http://registry.npmjs.org/formidable
    express@2.5.11 node_modules/express
    ├── qs@0.4.2
    ├── mime@1.2.4
    ├── mkdirp@0.3.0
    └── connect@1.9.2 (formidable@1.0.14)
    INFO: Main file found: /app.js
    INFO: Starting application.
    Express server started on port 8080
    [2013-08-22T17:53:42.245Z] Application initialized with pid 11010
    [√] Lizard Locator running at lizard-locator-895.onmodulus.net

The project's logs will be streamed in real-time during a deploy. You should see some information about Modulus' activity, as well as the NPM install process. In future deploy examples, these logs will be replaced for "...".

You can also pass in a directory as a command argument, if you do not want to deploy the current directory.

    $ modulus deploy my/project/directory
    Welcome to Modulus
    You are logged in as spiderman
    [?] Are you sure you want to use project Lizard Locator? (yes) yes
    Compressing project...
    2.9 KB written
    Uploading project...
    Upload progress [===================] 100%
    Deploying Project...
    ...
    [√] Lizard Locator running at lizard-locator-895.onmodulus.net

If you know which project you want to deploy to, you can use the *-p* option and provide the name of the project you would like to deploy to.

    $ modulus deploy -p "Lizard Locator" my/project/directory
    Welcome to Modulus
    You are logged in as spiderman
    Compressing project...
    2.9 KB written
    Uploading project...
    Upload progress [===================] 100%
    Deploying Project...
    ...
    [√] Lizard Locator running at lizard-locator-895.onmodulus.net

##Environment Variables

The CLI also provides an easy way to manage a project’s environment variables. You can start with listing your current variables with the *env list* command.

    $ modulus env list
    Welcome to Modulus
    You are logged in as spiderman
    [?] Are you sure you want to use project Lizard Locator? (yes) yes
    Project Lizard Locator Environment Variables
    NODE_ENV = production

To add a new variable, use the *env set* command. It takes two parameters, name and value. This command can also be used to change the value of an existing variable.

    $ modulus env set DB_AUTH 12345
    Welcome to Modulus
    You are logged in as spiderman
    [?] Are you sure you want to use project Lizard Locator? (yes) yes
    Setting DB_AUTH for project Lizard Locator
    [√] Successfully set environment variable.

If you have no need for a variable anymore, you can provide the *env delete* command with a name and it will be removed from the project.

    $ modulus env delete DB_AUTH
    Welcome to Modulus
    You are logged in as spiderman
    [?] Are you sure you want to use project Lizard Locator? (yes) yes
    Deleting DB_AUTH for project Lizard Locator
    [√] Successfully deleted variable DB_AUTH from project Lizard Locator

At any time, if you want to view the value of a single variable, use the *env get* command. It takes a name parameter and will display the value of the variable of the name you specify.

##MongoDB Database Management

Once logged in, you can create a MongoDB database. This is done with the *mongo create* command, and all that is required is a name.

    $ modulus mongo create
    Welcome to Modulus
    You are logged in as spiderman
    [?] Enter a database name: Lizard Locator DB
    [√] New MongoDB database Lizard Locator DB created.

You can optionally pass in the name with *mongo create*.

    $ modulus mongo create "Lizard Locator DB"
    Welcome to Modulus
    You are logged in as spiderman
    Creating MongoDB database Lizard Locator DB
    [√] New MongoDB database Lizard Locator DB created.

Once a database has been created a user should be added to it. Use the *mongo user create* command to create a database user.

    $ modulus mongo user create
    Welcome to Modulus
    You are logged in as spiderman
    Please choose which database to use:
      1) Lizard Locator DB
      2) Green Goblin DB
    [?] database 2
    Selected MongoDB database Green Goblin DB.
    [?] Enter username: johnny
    [?] Enter password: five
    [?] Read only permissions? (yes) no
    [✓] New MongoDB database user johnny created.

## API Tokens

It is possible to invoke commands that require authentication without logging
into a user account by using API tokens. This is especially useful when
automating actions such as deploys or sharing a Modulus project with multiple
developers without sharing a user name and password.

    $ modulus token create
    Welcome to Modulus
    You are logged in as spiderman
    [✓] Token: API-TOKEN

API Tokens use the MODULUS_TOKEN environment variable and can be used with any
command that requires authentication.

    $ MODULUS_TOKEN=API-TOKEN modulus deploy
    Welcome to Modulus
    You are logged in as spiderman
    [?] Are you sure you want to use project Lizard Locator? (yes)
    ...

Manage the API tokens that you have created using the list and remove commands.

    $ modulus token list
    Welcome to Modulus
    You are logged in as spiderman
    Current tokens:
    API-TOKEN

    $ modulus token remove API-TOKEN
    Welcome to Modulus
    You are logged in as spiderman
    [✓] Token successfully removed.

##Logs

In times when you need to check up on your projects, you can view the project's logs. This is done with the *project logs* command, which supports the *-p* option.

    $ modulus project logs -p "Lizard Locator"
    Welcome to Modulus
    You are logged in as spiderman
    INFO: Attaching persistent storage.
    INFO: Found package.json file: /package.json
    INFO: Node version not specified in package.json, using latest stable version.
    INFO: Initializing Node v0.10.13
    INFO: Running npm install.
    INFO: Registry: http://registry.npmjs.org
    npm http GET http://registry.npmjs.org/express
    npm http 304 http://registry.npmjs.org/express
    npm http GET http://registry.npmjs.org/qs
    npm http GET http://registry.npmjs.org/connect
    npm http GET http://registry.npmjs.org/mime/1.2.4
    npm http GET http://registry.npmjs.org/mkdirp/0.3.0
    npm http 304 http://registry.npmjs.org/qs
    npm http 304 http://registry.npmjs.org/connect
    npm http 304 http://registry.npmjs.org/mime/1.2.4
    npm http 304 http://registry.npmjs.org/mkdirp/0.3.0
    npm http GET http://registry.npmjs.org/mime/-/mime-1.2.4.tgz
    npm http GET http://registry.npmjs.org/mkdirp/-/mkdirp-0.3.0.tgz
    npm http GET http://registry.npmjs.org/qs/-/qs-0.4.2.tgz
    npm http 200 http://registry.npmjs.org/mime/-/mime-1.2.4.tgz
    npm http 200 http://registry.npmjs.org/mkdirp/-/mkdirp-0.3.0.tgz
    npm http 200 http://registry.npmjs.org/qs/-/qs-0.4.2.tgz
    npm http GET http://registry.npmjs.org/formidable
    npm http 304 http://registry.npmjs.org/formidable
    express@2.5.11 node_modules/express
    ├── qs@0.4.2
    ├── mime@1.2.4
    ├── mkdirp@0.3.0
    └── connect@1.9.2 (formidable@1.0.14)
    INFO: Main file found: /app.js
    INFO: Starting application.
    Express server started on port 8080
    [2013-08-22T17:53:42.245Z] Application initialized with pid 11010

    [✓] Logs successfully retrieved.

While these logs are not streamed directly to the CLI, the logs themselves are updated in real-time, so anytime you retrieve them they are current.