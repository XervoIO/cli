#MODULUS CLI

[![NPM version](https://badge.fury.io/js/modulus.svg)](http://badge.fury.io/js/modulus)

This is the official command line tool for [Modulus.io](https://modulus.io/).
Use it to create and manage your Modulus.io projects. For more detailed
descriptions of commands available, check out [the Modulus
codex](https://modulus.io/codex/cli/reference).

##Installing

To install the Modulus CLI, simply npm install it globally.

    $ npm install -g modulus

##Usage

Using the CLI is easy.

    Usage: modulus <command> <param1> <param2>

At any point you can run the *help* command to get a full list of commands and
how to use them.

You can also send feedback directly to Modulus using the *contact* command. Make
sure your message is enclosed in double quotes (eg. “Your message”).

    $ modulus contact "This is feedback from the CLI!"

##Account Related Commands

To start, you may need an account. Using the *signup* command, you can quickly
create an account to get things rolling. It will prompt you for a few required
pieces of information then set up an account.

    $ modulus signup

Once you have an account, you need to log in. Running the *login* command will
prompt you for your Modulus credentials or if you have linked your GitHub
account in the web portal (under account settings) you can use the *--github*
flag to login using your GitHub credentials. This keeps a session open so you
can run commands under your account and the session will not be closed unless
you run the *logout* command or log in with a different account.

    $ modulus login

You can also reset your password.

    $ modulus resetPassword

And to logout:

    $ modulus logout

##API Tokens

It is possible to invoke commands that require authentication without logging
into a user account by using API tokens. This is especially useful when
automating actions such as deploys or sharing a Modulus project with multiple
developers without sharing a user name and password.

    $ modulus token create

API Tokens use the `MODULUS_TOKEN` environment variable and can be used with any
command that requires authentication.

    $ MODULUS_TOKEN=API-TOKEN modulus deploy

Manage the API tokens that you have created using the list and remove commands.

    $ modulus token list
    $ modulus token remove API-TOKEN

##Project Management

Once logged in, you are ready to create a project. This is done with the
*project create* command, and all that is required is a name.

    $ modulus project create

You can optionally pass in the name with *project create*.

    $ modulus project create "Lizard Locator"

You can also delete a project with *project delete*. Add the *-p* option to pass
in a project name.

    $ modulus project delete

To deploy an application to your new project, you can use either the *project
deploy* command or its shorter sidekick, *deploy*. This command will take all
the contents of your current directory, zip them up and deploy them. Once the
deploy has started, the progress will be displayed. When the deploy completes,
you have a running application on Modulus. You can redeploy a new version of the
project at any time using the same process.

    $ cd my/project/directory modulus deploy

The project's logs will be streamed in real-time during a deploy. You should see
some information about Modulus' activity, as well as the npm install process.

You can also pass in a directory as a command argument, if you do not want to
deploy the current directory.

    $ modulus deploy my/project/directory

If you know which project you want to deploy to, you can use the *-p* option and
provide the name of the project you would like to deploy to.

    $ modulus deploy -p "Lizard Locator" my/project/directory

You can specify the node and npm version that your Node.js/Meteor application will use.
For Node.js projects, you can specify this within the engines block in the `package.json`.

```json
{
  "engines": {
    "node": "4.4.7",
    "npm": "3.10.5"
  }
}
```

To specify the node and npm versions on Meteor projects you can deploy with the
--node-version and --npm-version flags

    $ modulus deploy -p "Lizard Locator" --node-version 4.4.3 --npm-version 3.10.5

Meteor projects can set the --debug flag on deploys.

    $ modulus deploy -p "Lizard Locator" --debug

To start, stop, or restart a project, use:

    $ modulus project start

    $ modulus project stop

    $ modulus project restart

The *-p* option is available with these commands as well.

To scale a project to use multiple servos in a single infrastructure/region, you
can use *project scale <number>*.

    $ modulus project scale 2

For multiple infrastructure providers and regions, you need more details.

    $ modulus project scale aws.us-east-1a=1 joyent.us-east-1=1

Note that existing scale options are overwritten with this command. For example,
if a project is scaled to Digital Ocean, this will remove the Digital Ocean
servos and you'll end up with 1 in AWS and 1 in Joyent.

##Servo Commands

You can now also view all of your servos with *servo list*.

    $ modulus servo list

And you can restart a single servo with *servo restart*.

    $ modulus servo restart

 The *-i* option allows you to specify a servo id.

    $ modulus servo restart -i SERVO-ID

##Environment Variables

The CLI also provides an easy way to manage a project’s environment variables.
You can start with listing your current variables with the *env list* command.

    $ modulus env list

To add a new variable, use the *env set* command. It takes two parameters, name
and value. This command can also be used to change the value of an existing
variable.

    $ modulus env set DB_AUTH 12345

If you have no need for a variable anymore, you can provide the *env delete*
command with a name and it will be removed from the project.

    $ modulus env delete DB_AUTH

At any time, if you want to view the value of a single variable, use the *env
get* command. It takes a name parameter and will display the value of the
variable of the name you specify.

##MongoDB Database Management

Once logged in, you can create a MongoDB database. This is done with the *mongo
create* command, and all that is required is a name.

    $ modulus mongo create

You can optionally pass in the name with *mongo create*.

    $ modulus mongo create "Lizard Locator DB"

Once a database has been created a user should be added to it. Use the *mongo
user create* command to create a database user.

    $ modulus mongo user create

##Add-Ons Management

After logging in, you can set up add-ons for your project. To add an add-on to a
project, use *addons add*:

    $ modulus addons add keen:developer

Remove add-ons using *addons remove*:

    $ modulus addons list
    $ modulus addons remove keen

##Logs

In times when you need to check up on your projects, you can view the project's
logs. This is done with the *project logs* command, which supports the *-p*
option.

    $ modulus project logs -p "Lizard Locator"

While these logs are not streamed directly to the CLI, the logs themselves are
updated in real-time, so anytime you retrieve them they are current. To stream
your project's logs, you can use *logs tail*.

    $ modulus project logs tail

##Status

The *status* command allows you to view the status of Modulus as set on
status.modulus.io.

    $ modulus status

##License

Copyright (c) Modulus

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
