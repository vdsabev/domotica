var _ = require('lodash'),
    crypto = require('crypto'),
    utils = require('../utils');

module.exports = {
  statics: {
    fields: {
      query: utils.processFields(['_id', 'name', 'username', 'created']),
      options: utils.processFields(['limit', 'sort']),

      index: utils.processFields(['_id', 'name', 'username', 'created']),
      show: utils.processFields(['_id', 'name', 'username', 'created']),

      create: utils.processFields(['name', 'username', 'email']),
      update: utils.processFields(['name', 'username', 'email'])
    },

    // Static Methods
    encrypt: function (user, password) {
      var hash = crypto.createHash('sha256');
      if (!user.salt) {
        user.salt = hash.update(new Date().getTime() + '--' + password).digest('hex');
        hash = crypto.createHash('sha256');
      }
      return hash.update(user.salt + '--' + password).digest('hex');
    },
    authenticate: function (user, password) {
      return user && user.password === statics.encrypt(user, password);
    }
  },
  validators: {
    name: [
      {
        validator: function (value) {
          return value.length >= 2;
        },
        msg: 'INVALID_USER_NAME'
      }
    ],
    username: [
      {
        validator: function (value) {
          return /^[a-z0-9]+[-\w.]+[a-z0-9]+$/i.test(value);
        },
        msg: 'INVALID_USER_USERNAME'
      }
    ],
    email: [
      {
        validator: function (value) {
          return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(value);
        },
        msg: 'INVALID_USER_EMAIL'
      }
    ],
    password: [
      {
        validator: function (value) {
          return value.length >= 4;
        },
        msg: 'INVALID_USER_PASSWORD'
      }
    ]
  },
  pre: function (db) {
    return function (next) {
      // Timestamp
      var now = new Date();
      if (this.isNew) this.created = now;
      this.updated = now;

      next();
    };
  }
};
