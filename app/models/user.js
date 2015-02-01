var crypto = require('crypto'), // TODO: Replace with bcryptjs
    Schema = require('mongoose').Schema;

// The base unit of any social platform
module.exports = {
  attributes: {
    name: { type: String },
    description: String,
    email: { type: String, unique: true, lowercase: true, regex: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i, required: true },
    password: String,
    salt: String,
    settings: {
      private: Boolean,
      systemOfMeasurement: { type: String, enum: ['metric', 'imperial'], default: 'metric' },
      firstDayOfWeek: { type: Number, min: 0, max: 6, default: 1 }, // Monday
      dateFormat: {
        type: String,
        enum: ['D, dd M yy', 'DD, dd MM yy', 'mm-dd-yy', 'dd-mm-yy', 'yy-mm-dd', 'mm/dd/yy', 'dd/mm/yy', 'yy/mm/dd', 'mm.dd.yy', 'dd.mm.yy', 'yy.mm.dd'],
        default: 'D, dd M yy'
      },
      timeFormat: {
        type: String,
        enum: ['hh:mm TT', 'HH:mm'],
        default: 'HH:mm'
      },
      notifications: {
        // NOTIFICATION_CODE: { email: { type: Boolean, default: true }, database: { type: Boolean, default: true } }
      }
    },
    created: Date
  },
  statics: {
    fields: {
      query: services.api.processFields('_id', 'name', 'created'),
      options: services.api.processFields('limit', 'sort'),

      read: services.api.processFields('_id', 'name', 'description', 'created'),
      create: services.api.processFields('name', 'email', 'password'),
      update: services.api.processFields('name', 'description', 'email', 'password', 'settings')
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
      return user && this._id.toString() === user.toString();
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
