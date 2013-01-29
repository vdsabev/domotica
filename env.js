var _ = require('lodash');
_.defaults(process.env, {
  DATABASE_URL: 'localhost:27017/domotica',
  NODE_ENV: 'development',
  PORT: 3000,
  TZ: 'UTC'
});
