var _ = require('lodash');

// Set environment variables
// --------------------------------------------------
var env = module.exports = _.defaults(parse({ // Parse non-string types
  int: {
    port: 3000,
    pageSize: 10,
    limit: 100,
    maxSessionLength: 60 * 60 * 1000, // 1 hour
    maxExtendedSessionLength: 30 * 24 * 60 * 60 * 1000 // 30 days
  }
}), process.env, { // Use string environment variables without parsing them
  // Node variables
  NODE_ENV: 'development',
  TZ: 'UTC',
  // Other variables
  database: 'localhost:27017/domotica',
  sessionKeyField: '_key'
});

// Handle special cases
// --------------------------------------------------
// The session secret is required in production
if (env.sessionSecret === undefined) {
  if (env.NODE_ENV === 'production') throw new Error('The session secret hasn\'t been set!');
  env.sessionSecret = 'domotica';
}

// Log less messages in production and more in development,
// unless specified otherwise in the environment variables
if (env.logLevel === undefined) {
  env.logLevel = env.NODE_ENV === 'production' ? 1 : 2;
}

// Parsers
// --------------------------------------------------
function parse(settings) {
  var parsers = {
    int: parseInt,
    float: parseFloat,
    date: function () { return new Date(arguments) }
  };

  var parsed = {};
  _.each(settings, function (defaults, type) {
    _.each(defaults, function (defaultValue, key) {
      var parser = parsers[type];
      if (!parser) throw new Error('No parser exists for %s!', type);
      parsed[key] = isNaN(process.env[key]) ? defaultValue : parser(process.env[key]);
    });
  });
  return parsed;
}
