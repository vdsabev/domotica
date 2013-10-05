var _ = require('lodash'),
    crypto = require('crypto'),
    utils = require('../utils');

module.exports = {
  statics: {
    fields: {
      query: utils.processFields('_id', 'name', 'created'),
      options: utils.processFields('limit', 'sort'),

      index: utils.processFields('_id', 'name'),
      show: utils.processFields('_id', 'name', 'description', 'created'),

      create: utils.processFields('name', 'email', 'password'),
      update: utils.processFields('name', 'description', 'email', 'password', 'settings')
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
      return user && user.password === this.encrypt(user, password);
    }
  },
  methods: {
    is: function (user) {
      return this._id.toString() === user.toString();
    }
  },
  pre: function (db) {
    return function (next) {
      // Timestamp
      if (this.isNew) this.created = new Date();

      next();
    };
  }
};
