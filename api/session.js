var db = require('../db'),
    utils = require('../utils'),
    fields = {
      session: utils.processFields(['_id', 'name', 'username', 'email'])
    },
    maxSessionLength = 60 * 60 * 1000; // 1 hour

module.exports = {
  login: function (params, client, next) {
    var query = { $or: [{ username: params.account }, { email: params.account }] }
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
  logout: function (params, client, next) {
    delete client.session;
    return next();
  },

  validate: function (client) {
    if (client.session) {
      if (new Date().getTime() - client.session.timestamp < maxSessionLength) { // Session is still valid; refresh it
        client.session.timestamp = new Date().getTime();
        return true;
      }
      else {
        return false;
      }
    }
  }
};
