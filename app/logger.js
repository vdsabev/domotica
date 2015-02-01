// Logging

'use strict';

var env = require('var'),
    winston = require('winston');

var logger = module.exports = new (winston.Logger)();
if (env.logger) {
  if (env.logger.console) {
    logger.add(winston.transports.Console, env.logger.console);
  }

  if (env.logger.loggly) {
    logger.add(require('winston-loggly').Loggly, env.logger.loggly);
  }

  if (env.logger.mail) {
    logger.add(require('winston-mail').Mail, env.logger.mail);
  }
}
