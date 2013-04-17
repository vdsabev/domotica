var _ = require('lodash'),
    crypto = require('crypto'),
    utils = require('../utils');

module.exports = {
  statics: {
    fields: {
      query: utils.processFields(['_id', 'name', 'created']),
      options: utils.processFields(['limit', 'sort']),

      index: utils.processFields(['_id', 'name', 'created']),
      show: utils.processFields(['_id', 'name', 'created']),

      create: utils.processFields(['name', 'email', 'password']),
      update: utils.processFields(['name', 'email', 'password'])
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
      return user && user.password === module.exports.statics.encrypt(user, password);
    }
  },
  methods: {
    canBeEditedBy: function (user) {
      return this.id === user;
    }
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
