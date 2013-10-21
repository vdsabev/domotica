var env = require('var'),
    _ = require('lodash'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    db = mongoose.connect(env.database),
    extensions = {
      converter: require('./db/converter'),
      device: require('./db/device'),
      system: require('./db/system'),
      user: require('./db/user')
    };

var attributes = {
  // A template for devices
  converter: {
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

  // A physical device within a system
  device: {
    name: { type: String, required: true }, // EXAMPLE: Living Room Thermostat
    description: String,
    converter: { type: Schema.Types.ObjectId, ref: 'Converter', required: true },
    system: { type: Schema.Types.ObjectId, ref: 'System', required: true },
    pins: [{ // I/O pins on the system
      type: { type: String, enum: ['input', 'output'], required: true },
      index: { type: Number, required: true },
      name: String
    }],
    connection: String,
    interval: { type: Number, min: 1e3, default: 1e4 }, // In miliseconds
    values: [/* [Date, values] */], // Can contain a lot of data, arrays are more compact than objects
    // history: [{
    //   user: { type: Schema.Types.ObjectId, ref: 'User' },
    //   date: Date,
    //   converter: { type: Schema.Types.ObjectId, ref: 'Converter', null: true },
    //   system: { type: Schema.Types.ObjectId, ref: 'System', null: true }
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

  // Used to group devices; may represent a physical controller
  system: {
    name: { type: String, required: true },
    description: String,
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

  // The basic unit of any social platform
  user: {
    name: { type: String, required: true },
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
        enum: ['mm-dd-yy', 'dd-mm-yy', 'yy-mm-dd', 'mm/dd/yy', 'dd/mm/yy', 'yy/mm/dd', 'mm.dd.yy', 'dd.mm.yy', 'yy.mm.dd'],
        default: 'dd/mm/yy'
      },
      timeFormat: {
        type: String,
        enum: ['hh:mm TT', 'HH:mm'],
        default: 'HH:mm'
      },
      notifications: {
        // NOTIFICATION_CODE: { email: { type: Boolean, default: true }, system: { type: Boolean, default: true } }
      }
    },
    created: Date
  }
};

var schemas = {
  converter: new Schema(attributes.converter),
  device: new Schema(attributes.device),
  system: new Schema(attributes.system),
  user: new Schema(attributes.user)
};

// Extend Schema
for (var model in extensions) {
  var schema = schemas[model];
  var extension = extensions[model];

  // Attributes
  schema.statics.attributes = attributes[model];

  // Statics
  for (var obj in extension.statics) {
    schema.statics[obj] = extension.statics[obj];
  }

  // Methods
  for (var obj in extension.methods) {
    schema.methods[obj] = extension.methods[obj];
  }

  // Virtuals
  for (var field in extension.virtuals) {
    var virtual = extension.virtuals[field];
    for (var method in virtual) {
      schema.virtual(field)[method](virtual[method]);
    }
  }

  // Validators
  for (var path in extension.validators) {
    var field = schema.path(path);
    field.validate.apply(field, extension.validators[path]);
  };

  // Pre
  for (var event in extension.pre) {
    schema.pre(event, extension.pre[event](module.exports));
  }

  // Post
  for (var event in extension.post) {
    schema.post(event, extension.post[event](module.exports));
  }
}

// Initialize Models
var models = module.exports = {
  Converter: db.model('Converter', schemas.converter),
  Device: db.model('Device', schemas.device),
  System: db.model('System', schemas.system),
  User: db.model('User', schemas.user)
};
