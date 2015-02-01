// Common services that are used throughout app

module.exports = {
  setUp: function (done) {
    // Configure the server without starting it
    this.server = require('../app/server').config();
    done();
  },
  tearDown: function (done) {
    // Destroy the server
    this.server.destroy();
    done();
  },
  'API': {
    'processFields': {
      'should join fields when argument is string': function (test) {
        test.equal(services.api.processFields('lorem', 'ipsum', 'dolor', 'sit', 'amet')(' '), 'lorem ipsum dolor sit amet');
        test.done();
      },
      'should pick fields when argument is object': function (test) {
        test.deepEqual(services.api.processFields('lorem', 'amet')({ lorem: 'ipsum', dolor: ['sit', 'amet'] }), { lorem: 'ipsum' });
        test.done();
      },
      'should join selected fields when select and populate options are used': function (test) {
        test.equal(services.api.processFields('lorem', 'ipsum', 'dolor', 'sit', 'amet')(' ', { select: ['lorem', 'ipsum'], populate: ['dolor'] }), 'lorem ipsum dolor');
        test.done();
      }
    },
    'join': {
      'should return valid strings': function (test) {
        test.equal(services.api.join(['name', { fb: ['id'], db: ['test1', { test2: 'test3' }] }]), 'name fb.id db.test1 db.test2.test3');
        test.done();
      }
    },
    'pick': {
      'should return valid objects': function (test) {
        test.deepEqual(services.api.pick({ name: 'John', unwanted: 'field', fb: { id: '100001825159353', unwanted: 'field' } }, ['name', { fb: ['id'] }]), { name: 'John', fb: { id: '100001825159353' } });
        test.done();
      }
    }
  }
};
