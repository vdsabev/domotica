var Schema = require('mongoose').Schema;

// A template for devices
module.exports = {
  attributes: {
    name: { type: String, required: true }, // EXAMPLE: SCV Voltmeter v2.0
    description: String,
    unit: { type: String, required: true }, // EXAMPLE: Voltage
    symbol: String, // EXAMPLE: V
    formula: { type: String, required: true }, // EXAMPLE: sin(x / 1.25)
    minValue: Number, // Used when displaying values on a chart
    maxValue: Number, // ...
    // history: [{
    //   user: { type: Schema.Types.ObjectId, ref: 'User' },
    //   date: Date,
    //   unit: { type: String, required: true },
    //   symbol: String,
    //   formula: { type: String, required: true },
    //   minValue: Number,
    //   maxValue: Number
    // }],
    access: {
      edit: {
        level: { type: String, enum: ['private'], default: 'private' },
        // groups: [{ type: Schema.Types.ObjectId, ref: 'Group' }],
        users: [{ type: Schema.Types.ObjectId, ref: 'User' }]
      },
      view: {
        level: { type: String, enum: ['private', 'public'], default: 'private' },
        // groups: [{ type: Schema.Types.ObjectId, ref: 'Group' }],
        users: [{ type: Schema.Types.ObjectId, ref: 'User' }]
      }
    },
    created: Date
  },
  statics: {
    fields: {
      query: services.api.processFields('_id', 'name', 'created'),
      options: services.api.processFields('limit', 'sort'),

      read: services.api.processFields('_id', 'name', 'description', 'unit', 'symbol', 'formula', 'minValue', 'maxValue', 'created'),
      create: services.api.processFields('name', 'description', 'unit', 'symbol', 'formula', 'minValue', 'maxValue'),
      update: services.api.processFields('name', 'description', 'unit', 'symbol', 'formula', 'minValue', 'maxValue')
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
  pre: {
    save: function (db) {
      return function (next) {
        // Timestamp
        if (this.isNew) this.created = new Date();

        next();
      };
    }
  }
};
