// API related services

'use strict';

var crypto = require('crypto'); // TODO: Replace with bcryptjs

var session = module.exports = {
  encrypt: function (object) {
    if (session.validate(object)) {
      object.timestamp = new Date().getTime();
      var key = JSON.stringify(object);
      var cipher = crypto.createCipher('aes256', env.sessionSecret);
      key = cipher.update(key, 'utf8', 'hex');
      key += cipher.final('hex');

      return key;
    }
  },
  decrypt: function (key) {
    var decipher = crypto.createDecipher('aes256', env.sessionSecret);
    key = decipher.update(key, 'hex', 'utf8');
    key += decipher.final('utf8');
    var object = JSON.parse(key);

    if (session.validate(object)) {
      return object;
    }
  },
  validate: function (object) {
    return _.isObject(object);
  }
};
