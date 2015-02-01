// Fill the database with sample data

'use strict';

var env = require('var');

require('../controllers/user').create({ data: { email: env.email, password: env.password } }, null, function (error) {
  if (error) {
    throw new Error(error);
    process.exit(1);
  }

  process.exit(0);
});
