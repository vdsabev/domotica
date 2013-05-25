var _ = require('lodash'),
    utils = require('../utils');

module.exports = {
  statics: {
    fields: {
      query: utils.processFields(['_id', 'name', 'created']),
      options: utils.processFields(['limit', 'sort']),

      index: utils.processFields(['_id', 'name']),
      show: utils.processFields(['_id', 'name', 'description', 'converter', 'system']),

      create: utils.processFields(['name', 'description', 'converter', 'system']),
      update: utils.processFields(['name', 'description', 'converter', 'system'])
    }
  },
  methods: {
    canBeAdministeredBy: function (access) {
      return access &&
             (access.group && _.contains(this.access.admin.groups, access.group) ||
              access.user && _.contains(this.access.admin.users, access.user));
    },
    canBeControlledBy: function (access) {
      return (this.access.control.level === 'custom' && access &&
              (access.group && _.contains(this.access.control.groups, access.group) ||
               access.user && _.contains(this.access.control.users, access.user))
             ) ||
             this.canBeAdministeredBy(access);
    },
    canBeViewedBy: function (access) {
      return this.access.view.level === 'public' ||
             (this.access.view.level === 'custom' && access &&
              (access.group && _.contains(this.access.view.groups, access.group)) ||
              (access.user && _.contains(this.access.view.users, access.user))
             ) ||
             this.canBeControlledBy(access);
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
