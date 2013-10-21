var _ = require('lodash'),
    utils = require('../utils');

module.exports = {
  statics: {
    fields: {
      query: utils.processFields('_id', 'name', 'created'),
      options: utils.processFields('limit', 'sort'),

      read: utils.processFields('_id', 'name', 'description', 'unit', 'symbol', 'formula', 'minValue', 'maxValue', 'created'),
      create: utils.processFields('name', 'description', 'unit', 'symbol', 'formula', 'minValue', 'maxValue'),
      update: utils.processFields('name', 'description', 'unit', 'symbol', 'formula', 'minValue', 'maxValue')
    },
    query: {
      canBeViewedBy: function (access) {
        var query = {
          $or: [
            { access: null },
            { 'access.view': null },
            { 'access.view.level': null },
            { 'access.view.level': 'public' }
          ]
        };
        if (access && (access.user || access.group)) {
          _.each(['view', 'edit'], function (type) {
            var accessQuery = {};
            accessQuery['access.' + type + '.level'] = 'private';
            accessQuery.$or = [];
            if (access.user) {
              var user = {};
              user['access.' + type + '.users'] = access.user;
              accessQuery.$or.push(user);
            }
            if (access.group) {
              var group = {};
              group['access.' + type + '.groups'] = access.group;
              accessQuery.$or.push(group);
            }
            query.$or.push(accessQuery);
          });
        }
        return query;
      }
    }
  },
  methods: {
    canBeEditedBy: function (access) {
      return access &&
             (access.user && _.any(this.access.edit.users, function (user) { return user.toString() === access.user.toString() }) ||
              access.group && _.any(this.access.edit.groups, function (user) { return user.toString() === access.group.toString() }));
    },
    canBeViewedBy: function (access) {
      return this.access.view.level === 'public' ||
             (this.access.view.level === 'private' && access &&
              (access.user && _.any(this.access.view.users, function (user) { return user.toString() === access.user.toString() }) ||
               access.group && _.any(this.access.view.groups, function (user) { return user.toString() === access.group.toString() }))
             ) ||
             this.canBeEditedBy(access);
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
