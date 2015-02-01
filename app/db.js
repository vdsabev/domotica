var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    db = mongoose.connect(env.database);

var models = module.exports = {};
var extensions = require('./module')('/models');
var schemas = {};

// Initialize extensions and schemas
_.each(extensions, function (extension, key) {
  schemas[key] = new Schema(extension.attributes);
});

// Extend Schema
_.each(extensions, function (extension, key) {
  var schema = schemas[key];

  // Attributes
  schema.statics.attributes = extension.attributes;

  // Statics
  _.each(extension.statics, function (stat, obj) {
    schema.statics[obj] = stat;
  });

  // Methods
  _.each(extension.methods, function (method, obj) {
    schema.methods[obj] = method;
  });

  // Virtuals
  _.each(extension.virtuals, function (virtuals, field) {
    _.each(virtuals, function (virtual, method) {
      schema.virtual(field)[method](virtual);
    });
  });

  // Validators
  _.each(extension.validators, function (validator, path) {
    var field = schema.path(path);
    field.validate.apply(field, validator);
  });

  // Pre
  _.each(extension.pre, function (pre, event) {
    schema.pre(event, pre(module.exports));
  });

  // Post
  _.each(extension.post, function (post, event) {
    schema.post(event, post(module.exports));
  });
});

// Initialize Models
_.each(extensions, function (extension, key) {
  // Capitalize first letter, e.g. `controler` -> `Controller`
  var capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
  models[capitalizedKey] = db.model(capitalizedKey, schemas[key]);
});
