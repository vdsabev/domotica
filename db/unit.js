var _ = require('lodash'),
    utils = require('../utils');

module.exports = {
  statics: {
    fields: {
      query: utils.processFields(['_id', 'name', 'description', 'created']),
      options: utils.processFields(['limit', 'sort']),

      index: utils.processFields(['_id', 'name', 'description', 'formula', 'created']),
      show: utils.processFields(['_id', 'name', 'description', 'formula', 'created']),

      create: utils.processFields(['name', 'description', 'systems', 'formula']),
      update: utils.processFields(['name', 'description', 'systems', 'formula'])
    }
  },
  methods: {
    canBeAdministeredBy: function (user) {
      return _.contains(this.access.admin, user);
    },
    canBeEditedBy: function (user) {
      return this.access.edit.level === 'custom' && _.contains(this.access.edit.users, user) ||
             this.canBeAdministeredBy(user);
    },
    canBeViewedBy: function (user) {
      return this.access.view.level === 'public' ||
             this.access.view.level === 'custom' && _.contains(this.access.view.users, user) ||
             this.canBeEditedBy(user);
    }
  },
  validators: {
    name: [
      {
        validator: function (value) {
          return value.length >= 2;
        },
        msg: 'INVALID_UNIT_NAME'
      }
    ]
  },
  pre: function (db) {
    return function (next) {
      // Timestamp
      if (this.isNew) this.created = new Date();

      next();
    };
  }
};
