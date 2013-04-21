var env = require('../env'),
    _ = require('lodash'),
    crypto = require('crypto'),
    db = require('../db'),
    maxSessionLength = 60 * 60 * 1000; // 1 hour

var session = module.exports = {
  create: function (params, client, next) {
    var query = { email: params.email };
    var select = '_id name email password salt';
    var options = { lean: true };
    db.User.findOne(query, select, options, function (error, user) {
      if (error) return next(error);
      if (!db.User.authenticate(user, params.password)) return next('INVALID_LOGIN');

      client.handshake.session = _.pick(user, '_id', 'name', 'email');
      var data = _.pick(user, '_id', 'name');
      data[env.sessionKey] = session.encrypt(client.handshake.session);
      return next(null, data);
    });
  },
  refresh: function (params, client, next) {
    if (!client.handshake.session) {
      if (!params[env.sessionKey]) return next('BAD_REQUEST'); // No key sent, cancel refresh

      client.handshake.session = session.decrypt(params[env.sessionKey]);
      if (!client.handshake.session || isNaN(client.handshake.session.timestamp)) { // The key was invalid, cancel refresh
        return next('BAD_REQUEST');
      }
    }

    var now = new Date().getTime();
    if (now - client.handshake.session.timestamp > maxSessionLength) {
      return next('SESSION_EXPIRED');
    }

    var key = session.encrypt(client.handshake.session);
    return next(null, key);
  },
  destroy: function (params, client, next) {
    delete client.handshake.session;
    return next();
  },

  encrypt: function (object) {
    object = _.defaults({ timestamp: new Date().getTime() }, object);
    var key = JSON.stringify(object);
    var cipher = crypto.createCipher('aes256', env.sessionSecret);
    key = cipher.update(key, 'utf8', 'hex');
    key += cipher.final('hex');

    return key;
  },
  decrypt: function (key) {
    var decipher = crypto.createDecipher('aes256', env.sessionSecret);
    key = decipher.update(key, 'hex', 'utf8');
    key += decipher.final('utf8');
    var object = JSON.parse(key);

    return object;
  }
};
