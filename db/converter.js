var _ = require('lodash'),
    utils = require('../utils');

module.exports = {
  statics: {
    fields: {
      query: utils.processFields(['_id', 'name', 'created']),
      options: utils.processFields(['limit', 'sort']),

      index: utils.processFields(['_id', 'name']),
      show: utils.processFields(['_id', 'name', 'description', 'unit', 'symbol', 'formula', 'minValue', 'maxValue']),

      create: utils.processFields(['name', 'description', 'unit', 'symbol', 'formula', 'minValue', 'maxValue']),
      update: utils.processFields(['name', 'description', 'unit', 'symbol', 'formula', 'minValue', 'maxValue'])
    }
  },
  methods: {
    canBeAdministeredBy: function (access) {
      return access &&
             ((access.group && _.contains(this.access.admin.groups, access.group)) ||
             (access.user && _.contains(this.access.admin.users, access.user)));
    },
    canBeViewedBy: function (access) {
      return this.access.view.level === 'public' ||
             (this.access.view.level === 'custom' && access &&
              (access.group && _.contains(this.access.view.groups, access.group) ||
               access.user && _.contains(this.access.view.users, access.user))
             ) ||
             this.canBeAdministeredBy(access);
    }
  },
  validators: {
    name: [
      {
        validator: function (value) {
          return value.length >= 2;
        },
        msg: 'INVALID_CONVERTER_NAME'
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
