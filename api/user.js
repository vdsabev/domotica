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
    db.User.findOne(params.username, db.User.fields.show(' '), { lean: true }, function (error, user) {
      if (!user) return next('NOT_FOUND');
      return next(error, user);
    });
  },
  create: function (params, client, next) {
    var user = db.User.fields.create(params);
    db.User.create(user, function (error, user) {
      return next(error, user);
    });
  },
  update: function (params, client, next) {
    if (!client.session) return next('UNAUTHORIZED');

    db.User.findById(params._id).exec(function (error, user) {
      if (error) return next(error);
      if (!user) return next('NOT_FOUND');
      if (!user.canBeEditedBy(client.session._id)) return next('FORBIDDEN');

      user.set(db.User.fields.update(params));
      user.save(function (error) {
        return next(error, user);
      });
    });
  }
};
