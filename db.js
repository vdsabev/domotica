var env = require('./env'),
    _ = require('lodash'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    db = mongoose.connect(env.database),
    extensions = {
      system: require('./db/system'),
      user: require('./db/user')
    };

var attributes = {
  system: {
    name: { type: String, required: true },
    description: String,
    access: {
      admin: { type: Schema.Types.ObjectId, ref: 'User' },
      edit: {
        level: {
          type: String,
          enum: ['private', 'whitelist'],
          default: 'private'
        },
        users: [{ type: Schema.Types.ObjectId, ref: 'User' }]
      },
      view: {
        level: {
          type: String,
          enum: ['private', 'whitelist', 'public'],
          default: 'private'
        },
        users: [{ type: Schema.Types.ObjectId, ref: 'User' }]
      }
    },
    created: Date,
    updated: Date
  },

  user: {
    name: String,
    email: { type: String, unique: true, lowercase: true, regex: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i, required: true },
    password: String,
    salt: String,
    created: Date,
    updated: Date
  }
};

var schemas = {
  system: new Schema(attributes.system),
  user: new Schema(attributes.user)
};

var models = module.exports = {};

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
_.extend(models, {
  System: db.model('System', schemas.system),
  User: db.model('User', schemas.user)
});
