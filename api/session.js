var db = require('../db'),
    utils = require('../utils'),
    fields = {
      session: utils.processFields(['_id', 'name', 'email'])
    },
    maxSessionLength = 60 * 60 * 1000; // 1 hour

module.exports = {
  create: function (params, client, next) {
    var query = { email: params.email };
    var select = fields.session(' ') + ' password salt';
    var options = { lean: true };
    db.User.findOne(query, select, options, function (error, user) {
      if (error) return next(error);
      if (!db.User.authenticate(user, params.password)) return next('INVALID_LOGIN');

      client.session = fields.session(user);
      client.session.timestamp = new Date().getTime();
      return next(error, fields.session(user));
    });
  },
  destroy: function (params, client, next) {
    delete client.session;
    return next();
  },

  validate: function (client) {
    if (client.session) {
      var now = new Date().getTime();
      if (now - client.session.timestamp < maxSessionLength) { // Session is still valid; refresh it
        client.session.timestamp = now;
        return true;
      }
      else {
        return false;
      }
    }
  }
};
