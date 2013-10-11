var _ = require('lodash'),
    db = require('../db');

module.exports = {
  index: function (data, client, next) {
    var query = db.User.fields.query(data);
    var select = db.User.fields.read(' ', data);
    var options = _.merge({ sort: { created: -1 } }, db.User.fields.options(data), { lean: true });
    db.User.find(query, select, options, next);
  },
  show: function (data, client, next) {
    var select = db.User.fields.read(' ', data);
    var options = { lean: true };
    db.User.findById(data._id, select, options, function (error, user) {
      if (error) return next(error);
      if (!user) return next('NOT_FOUND');

      return next(null, user);
    });
  },
  create: function (data, client, next) {
    var user = db.User.fields.create(data);

    // TODO: Validate password
    // if (!db.User.validate(user)) return next('BAD_REQUEST');

    user.password = db.User.encrypt(user, user.password);
    db.User.create(user, next);
  },
  update: function (data, client, next) {
    if (!client.handshake.session) return next('UNAUTHORIZED');

    db.User.findById(data._id, function (error, user) {
      if (error) return next(error);
      if (!user) return next('NOT_FOUND');
      if (!user.is(client.handshake.session._id)) return next('FORBIDDEN');

      _.extend(user, db.User.fields.update(data));
      user.save(next);
    });
  }
};
