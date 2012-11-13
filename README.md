<pre>
 __    __   ______   _____    __  __   __       __  __   ______
/\ "-./  \ /\  __ \ /\  __-. /\ \/\ \ /\ \     /\ \/\ \ /\  ___\
\ \ \-./\ \\ \ \/\ \\ \ \/\ \\ \ \_\ \\ \ \____\ \ \_\ \\ \___  \
 \ \_\ \ \_\\ \_____\\ \____- \ \_____\\ \_____\\ \_____\\/\_____\
  \/_/  \/_/ \/_____/ \/____/  \/_____/ \/_____/ \/_____/ \/_____/
</pre>
      
This is the offical command line tool for <a href="https://modulus.io/" target="_blank">Modulus.io</a>. Use it to create and manage you Modulus.io projects. 

##Installing
To install the Modulus CLI, simple NPM install it globally.

    $ npm install -g modulus

At any point you can run the *help* command to get a full list of commands and how to use them.

You can also send feedback directly to Modulus using the *contact* command. Make sure your message is enclosed in double quotes (eg. “Your message”).

    $ modulus contact "This is feedback from the CLI!"
    Welcome to Modulus
    You are logged in as spiderman
    [√] Feedback sent. Thank you for the message.

##Creating an Account

To start, you may need an account. Using the *signup* command, you can quickly create an account to get things rolling. It will prompt you for a few required pieces of information then set up and account.

    $ modulus signup
    Welcome to Modulus
    In order to sign up we a few pieces of information.
    [?] Choose a username: spiderman
    [?] Enter a valid email: parker@example.com
    [?] Enter a password:
    [√] User spiderman has been created successfully.

    You should receive an email at parker@example.com with more information.

Once you have an account, you need to log in. Running the *login* command will prompt you for your credentials, then keep a session open so you can run commands under your account in the future. This session will never be closed unless you run the logout command.

    $ modulus login
    Welcome to Modulus
    [?] Enter your username or email: spiderman
    [?] Enter your password:
    [√] Signed in as user spiderman

When you first create an account it is in a “beta locked” state. This means you cannot create or manage any projects until you unlock your account. Running the *unlock* command will prompt you for a beta code and unlock your account when a valid one is given.

    $ modulus unlock
    Welcome to Modulus
    You are logged in as spiderman
    [?] Enter a beta code: 2hMN2HFZ
    [√] Your account has been unlocked. You may now create and deploy projects

##Project Management

Once unlocked, you are finally ready to create a project. This is done with the *project create* command, and all that is required is a name.

    $ modulus project create
    Welcome to Modulus
    You are logged in as spiderman
    [?] Enter a project name: Lizard Locator
    [√] New project Lizard Locator created.

To deploy an application to your new project, you can use either the *project deploy* command or its shorter sidekick, *deploy*. This command will take all the contents of your current directory, zip them up and deploy them. Once the deploy has started, the progress will be displayed. When the deploy completes, you have a running application on Modulus. You can redeploy a new version of the project at any time using the same process.

    $ modulus deploy
    Welcome to Modulus
    You are logged in as spiderman
    [?] Are you sure you want to use project Lizard Locator? (yes) yes
    Compressing project...
    2.9 KB written
    Uploading project...
    Upload progress [===================] 100%
    Deploying Project...
    Deploying [    =               ]
    [√] Lizard Locator running at lizard-locator-895.onmodulus.net

##Environment Variables

The CLI also provides an easy way to manage a project’s environment variables. You can start with listing your current variables with the *env list* command.

    $ modulus env list
    Welcome to Modulus
    You are logged in as spiderman
    [?] Are you sure you want to use project Lizard Locator? (yes) yes
    Project Lizard Locator Environment Variables
    NODE_ENV = production

To add a new variable, use the *env set* command. It takes two parameters, name and value. This command can also be used to change the value of a current variable.

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