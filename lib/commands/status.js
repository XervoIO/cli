/*
 * Copyright (c) 2014 Modulus
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 */

var request       = require('request');
var createTable   = require('text-table');

var modulus = require('../modulus');
var url     = 'http://status.progress.com/api/v2/summary.json';

var Status = {};
var STACK = [
  'Web Interface', 'API', 'MongoDB', 'Balancers',
  'Stats', 'Application Hosts', 'Build Hosts', 'Support'
];

Status.get = function (callback) {
  request.get({
    url: url,
    json: true
  },
  function (err, response, body) {
    var table = [];

    if (err) return callback(err);
    if (!body.components || !body.components.length) return callback('Status not available');

    body.components.forEach(function (component) {
      if (STACK.indexOf(component.name) === -1) return;

      if (component.status === 'operational') {
        table.push([
          component.name.grey + ': '.grey,
          component.status.replace('_', ' ').green
        ]);
      } else {
        table.push([
          component.name.grey + ': '.grey,
          component.status.replace('_', ' ').red
        ]);
      }
    });

    modulus.io.print('--------------------------------------------------');
    modulus.io.print('Current Status'.grey);
    modulus.io.print('--------------------------------------------------');
    modulus.io.print(createTable(table));
    modulus.io.print('--------------------------------------------------');
    modulus.io.print('View full details at ' + 'https://status.progress.com'.blue);
    modulus.io.print('--------------------------------------------------');
    callback();
  });
};

module.exports = Status;
