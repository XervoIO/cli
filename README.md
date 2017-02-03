# Xervo CLI

[![npm](https://img.shields.io/npm/v/@xervo/cli.svg?maxAge=2592000)][npm]

This is the official command line tool for [Xervo.io](https://xervo.io/).
Use it to create and manage your Xervo.io projects. For more detailed
descriptions of commands available, check out [the Xervo
codex](https://xervo.io/codex/cli/reference).

## Installing

To install the Xervo CLI, simply npm install it globally.

    $ npm install -g @xervo/cli

## Usage

Using the CLI is easy.

    Usage: xervo <command> <param1> <param2>

At any point you can run the *help* command to get a full list of commands and
how to use them.

You can also send feedback directly to Xervo using the *contact* command. Make
sure your message is enclosed in double quotes (eg. “Your message”).

    $ xervo contact "This is feedback from the CLI!"

## Documentation

- [Account Related Commands](docs/README.md#account-related-commands)
- [API Tokens](docs/README.md#api-tokens)
- [Project Management](docs/README.md#project-management)
- [Servo Commands](docs/README.md#servo-commands)
- [Environment Variables](docs/README.md#environment-variables)
- [MongoDB Database Management](docs/README.md#mongoDB-database-management)
- [Add-Ons Management](docs/README.md#add-ons-management)
- [Logs](docs/README.md#logs)
- [Status](docs/README.md#status)

## License

Copyright (c) 2014-2017 Tangible Labs, LLC

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

[npm]: https://www.npmjs.com/package/@xervo/cli
