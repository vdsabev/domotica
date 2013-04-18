var _ = require('lodash'),
    db = require('../db'),
    crypto = require('crypto'),
    maxSessionLength = 60 * 60 * 1000; // 1 hour

var session = module.exports = {
  auth: function (handshake, next) {
    if (handshake.query.key) {
      handshake.session = session.decrypt(handshake.query.key);

      var now = new Date().getTime();
      if (now - handshake.session.timestamp > maxSessionLength) {
        return next('SESSION_EXPIRED');
      }
    }

    next(null, true);
  },
  create: function (params, client, next) {
    var query = { email: params.email };
    var select = '_id name email password salt';
    var options = { lean: true };
    db.User.findOne(query, select, options, function (error, user) {
      if (error) return next(error);
      if (!db.User.authenticate(user, params.password)) return next('INVALID_LOGIN');

      var data = _.pick(user, '_id', 'name');
      client.handshake.session = _.pick(user, '_id');
      var key = session.encrypt(client.handshake.session);
      return next(null, { data: data, key: key });
    });
  },
  refresh: function (params, client, next) {
    if (!client.handshake.session) return next('UNAUTHORIZED');

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
    var cipher = crypto.createCipher('aes256', process.env.sessionSecret);
    key = cipher.update(key, 'utf8', 'hex');
    key += cipher.final('hex');

    return key;
  },
  decrypt: function (key) {
    var decipher = crypto.createDecipher('aes256', process.env.sessionSecret);
    key = decipher.update(key, 'hex', 'utf8');
    key += decipher.final('utf8');
    var object = JSON.parse(key);

    return object;
  }
};
