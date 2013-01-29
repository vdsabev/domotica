var _ = require('lodash'),
    utils = require('../utils');

module.exports = {
  statics: {
    fields: {
      query: utils.processFields(['_id', 'name', 'description', 'created']),
      options: utils.processFields(['limit', 'sort']),

      index: utils.processFields(['_id', 'name', 'description', 'access', 'created']),
      show: utils.processFields(['_id', 'name', 'description', 'access', 'created']),

      create: utils.processFields(['name', 'description', 'access']),
      update: utils.processFields(['name', 'description', 'access'])
    }
  },
  methods: {
    canBeEditedBy: function (user) {
      return this.access.admin === user || this.access.edit.level !== 'private' && _(this.access.edit.users).contains(user);
    }
  },
  validators: {
    name: [
      {
        validator: function (value) {
          return value.length >= 2;
        },
        msg: 'INVALID_SYSTEM_NAME'
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
