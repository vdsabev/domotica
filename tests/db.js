var _ = require('lodash'),
    async = require('async'),
    db = require('../db');

var converter;

module.exports = {
  'Controller': {
    'should exist': function (next) {
      db.should.have.property('Controller');
      return next();
    },
    'should validate': validate('Controller')
  },
  'Converter': {
    'should exist': function (next) {
      db.should.have.property('Converter');
      return next();
    },
    'should validate': validate('Converter'),
    'should create': function (next) {
      converter = new db.Converter({ name: 'Converter 1', unit: 'Constant', formula: '1' });
      converter.save(function (error, object) {
        (error == null).should.be.true;
        (object != null).should.be.true;
        object.should.have.property('_id', converter._id);
        object.should.have.property('name', converter.name);
        object.should.have.property('unit', converter.unit);
        object.should.have.property('formula', converter.formula);

        return next();
      });
    },
    'should destroy': function (next) {
      converter.remove(function (error, removed) {
        (error == null).should.be.true;
        return next();
      });
    }
  },
  'Device': {
    'should exist': function (next) {
      db.should.have.property('Device');
      return next();
    },
    'should validate': validate('Device')
  },
  'User': {
    'should exist': function (next) {
      db.should.have.property('User');
      return next();
    },
    'should validate': validate('User')
  }
};

function validate(model) {
  return function (next) {
    db[model].find({}, function (error, objects) {
      (error == null).should.be.true;
      async.parallel(_.map(objects, function (object) {
        return function (next) {
          object.validate(next);
        };
      }), function (error) {
        (error == null).should.be.true;
        return next();
      });
    });
  };
}
