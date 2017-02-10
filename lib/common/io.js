var prompt = require('prompt')

prompt.start()
prompt.message = '[' + '?'.yellow + '] '
prompt.delimiter = ''

var io = {}

io.print = function (text) {
  console.log(text.white)
}

io.write = function (text) {
  process.stdout.write(text)
}

io.success = function (text) {
  io.print('[' + '✓'.green + ']' + ' ' + text)
}

io.warning = function (text) {
  io.print('[' + 'Warning'.warn + '] ' + text)
}

io.error = function (text) {
  io.print('[' + 'Error'.error + '] ' + text)
}

/**
 * Helper for starting an indeterminate progress bar.
 * @param {Object} bar The progress bar to start.
 */
io.startIndeterminate = function (bar) {
  if (process.stdout.isTTY) {
    return bar.start()
  }
}

/**
 * Helper for stoping an indeterminate progress bar.
 * @param {Object} bar The progress bar to stop.
 */
io.stopIndeterminate = function (bar) {
  if (process.stdout.isTTY) {
    return bar.stop()
  }
}

io.prompt = prompt

module.exports = io
