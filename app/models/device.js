var Schema = require('mongoose').Schema;

// A device within a controller
module.exports = {
  attributes: {
    name: { type: String, required: true }, // EXAMPLE: Living Room Thermostat
    description: String,
    controller: { type: Schema.Types.ObjectId, ref: 'Controller', required: true },
    converter: { type: Schema.Types.ObjectId, ref: 'Converter', required: true },
    type: { type: String, enum: ['input', 'output'], required: true },
    pins: [new Schema({
      name: String,
      index: { type: Number, required: true }
    }, { _id: false })],
    interval: { type: Number, min: 0, default: 10e3 }, // In miliseconds; 0 means transmitting is paused
    values: [/* [Date, value] */], // Could contain a lot of data, and arrays are more compact than objects
    // history: [{
    //   user: { type: Schema.Types.ObjectId, ref: 'User' },
    //   date: Date,
    //   controller: { type: Schema.Types.ObjectId, ref: 'Controller', null: true }
    //   converter: { type: Schema.Types.ObjectId, ref: 'Converter', null: true },
    // }],
    access: {
      edit: {
        level: { type: String, enum: ['private'], default: 'private' },
        // groups: [{ type: Schema.Types.ObjectId, ref: 'Group' }],
        users: [{ type: Schema.Types.ObjectId, ref: 'User' }]
      },
      control: {
        level: { type: String, enum: ['private', 'public'], default: 'private' },
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

      read: services.api.processFields('_id', 'name', 'description', 'controller', 'converter', 'type', 'pins', 'interval', 'values', 'created'),
      create: services.api.processFields('name', 'description', 'controller', 'converter', 'type', 'pins', 'interval'),
      update: services.api.processFields('name', 'description', 'controller', 'converter', 'type', 'pins', 'interval')
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
          _.each(['view', 'control', 'edit'], function (type) {
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
    canBeControlledBy: function (access) {
      return (this.access.control.level === 'private' && access &&
              (access.user && _.any(this.access.control.users, function (user) { return user.toString() === access.user.toString() }) ||
               access.group && _.any(this.access.control.groups, function (user) { return user.toString() === access.group.toString() }))
             ) ||
             this.canBeEditedBy(access);
    },
    canBeViewedBy: function (access) {
      return this.access.view.level === 'public' ||
             (this.access.view.level === 'private' && access &&
              (access.user && _.any(this.access.view.users, function (user) { return user.toString() === access.user.toString() }) ||
               access.group && _.any(this.access.view.groups, function (user) { return user.toString() === access.group.toString() }))
             ) ||
             this.canBeControlledBy(access);
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
