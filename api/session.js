var env = require('var'),
    _ = require('lodash'),
    crypto = require('crypto'),
    db = require('../db');

var session = module.exports = {
  fields: ['_id', 'name', 'email'],

  create: function (data, client, next) {
    if (!_.isString(data.email)) return next('BAD_REQUEST');

    var query = { email: data.email.toLowerCase() };
    var select = '_id name email password salt';
    var options = { lean: true };
    db.User.findOne(query, select, options, function (error, user) {
      if (error) return next(error);
      if (!db.User.authenticate(user, data.password)) return next('INVALID_LOGIN');

      client.handshake.session = _.extend(_.pick(user, session.fields), _.pick(data, 'remember'));
      var key = session.encrypt(client.handshake.session);
      if (!key) return next('BAD_REQUEST');

      var res = _.pick(user, '_id', 'name');
      res[env.sessionKeyField] = key;

      return next(null, res);
    });
  },
  destroy: function (data, client, next) {
    delete client.handshake.session;
    return next();
  },
  refresh: function (data, client, next) {
    return next();
  },

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
