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

    describe('project.isSupported passes', function () {
      it('returns true when version is greater than min version', function (done) {
        supported = Controller.isSupported('1.3.3', 'Meteor');
        expect(supported).to.equal(true);
        done();
      });

      it('return true when runtime is not Meteor', function (done) {
        supported = Controller.isSupported('5.9.0', 'Node.js');
        expect(supported).to.equal(true);
        done();
      });

      it('returns true on passing non-semver version', function (done) {
        var nonSemver = ['1.3.3.4', '1.4', '1.5-beta', '2.alpha', '2-alpha', '3'];
        nonSemver.forEach(function (version) {
          supported = Controller.isSupported(version, 'Meteor');
          expect(supported).to.equal(true);
        });
        done();
      });

      it('returns true when major is greater than min supported major', function (done) {
        supported = Controller.isSupported('2.0.0', 'Meteor');
        expect(supported).to.equal(true);
        done();
      });
    });

    describe('project.isSupported fails', function () {
      it('returns false when version is less than min supported version', function (done) {
        supported = Controller.isSupported('1.2.5', 'Meteor');
        expect(supported).to.equal(false);
        done();
      });

      it('returns false when major does not pass', function (done) {
        supported = Controller.isSupported('0.3.4', 'Meteor');
        expect(supported).to.equal(false);
        done();
      });

      it('returns false when minor does not pass', function (done) {
        supported = Controller.isSupported('1.2.4', 'Meteor');
        expect(supported).to.equal(false);
        done();
      });

      it('returns false on failing non-semver version', function (done) {
        var nonSemver = ['0', '0.1', '1', '1.2-alpha', 'infinite'];
        nonSemver.forEach(function (version) {
          supported = Controller.isSupported(version, 'Meteor');
          expect(supported).to.equal(false);
        });
        done();
      });
    });
  });
});
