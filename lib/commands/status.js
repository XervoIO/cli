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

const Request = require('request');
const CreateTable = require('text-table');

const Modulus = require('../modulus');
const URL = 'http://yzskf90qzqff.statuspage.io/api/v2/summary.json';

var Status = {};

Status.get = function (callback) {
  Request.get({
    url: URL,
    json: true
  },
  function (err, response, body) {
    var table = [];
    if (err) return callback(err);

    body.components.forEach(function (component) {
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

    Modulus.io.print('--------------------------------------------------');
    Modulus.io.print('Current Status'.grey);
    Modulus.io.print('--------------------------------------------------');
    Modulus.io.print(CreateTable(table));
    Modulus.io.print('--------------------------------------------------');
    Modulus.io.print('View full details at ' + 'http://status.modulus.io'.blue);
    Modulus.io.print('--------------------------------------------------');
    callback();
  });
};

module.exports = Status;
