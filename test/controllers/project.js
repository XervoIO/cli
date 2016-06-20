const Controller = require('../../lib/controllers/project.js');

const Code = require('code');
const Lab = require('lab');

var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;
var expect = Code.expect;

describe('projectController', function () {
  describe('project.isSupported', function () {
    var runtime, srcVersion, supported;

    it('returns true when version is greater than min version', function (done) {
      supported = Controller.isSupported('1.3.3', 'Meteor');
      expect(supported).to.equal(true);
      done();
    });

    it('returns false when version is less than min supported version', function (done) {
      supported = Controller.isSupported('1.2.5', 'Meteor');
      expect(supported).to.equal(false);
      done();
    });

    it('return true when runtime is not Meteor', function (done) {
      supported = Controller.isSupported('5.9.0', 'Node.js');
      expect(supported).to.equal(true);
      done();
    });
  });
});