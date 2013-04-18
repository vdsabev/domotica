var _ = require('lodash'),
    db = require('../db');

module.exports = {
  index: function (params, client, next) {
    var query = db.User.fields.query(params);
    var select = db.User.fields.index(' ');
    var options = _.merge({ sort: { created: -1 } }, db.User.fields.options(params), { lean: true });
    db.User.find(query, select, options, next);
  },
  show: function (params, client, next) {
    db.User.findOne(params._id, db.User.fields.show(' '), { lean: true }, function (error, user) {
      if (error) return next(error);
      if (!user) return next('NOT_FOUND');
      return next(null, user);
    });
  },
  create: function (params, client, next) {
    var user = db.User.fields.create(params);

    // TODO: Validate password
    // if (!valid) return next('BAD_REQUEST');

    user.password = db.User.encrypt(user, user.password);
    db.User.create(user, next);
  },
  update: function (params, client, next) {
    if (!client.handshake.session) return next('UNAUTHORIZED');

    db.User.findById(params._id).exec(function (error, user) {
      if (error) return next(error);
      if (!user) return next('NOT_FOUND');
      if (!user.canBeEditedBy(client.handshake.session._id)) return next('FORBIDDEN');

      _.extend(user, db.User.fields.update(params));
      user.save(next);
    });
  }
};
