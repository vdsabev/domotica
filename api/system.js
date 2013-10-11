var _ = require('lodash'),
    db = require('../db');

module.exports = {
  index: function (data, client, next) {
    var query = {
      $and: [
        db.System.fields.query(data),
        db.System.query.canBeViewedBy({ user: client.handshake.session && client.handshake.session._id })
      ]
    };
    var select = db.System.fields.read(' ', data);
    var options = _.merge({ sort: { created: -1 } }, db.System.fields.options(data), { lean: true });
    db.System.find(query, select, options, next);
  },
  show: function (data, client, next) {
    var select = db.System.fields.read(' ', data) + ' access';
    db.System.findById(data._id, select, function (error, system) {
      if (error) return next(error);
      if (!system) return next('NOT_FOUND');
      if (!system.canBeViewedBy({ user: client.handshake.session && client.handshake.session._id })) return next('FORBIDDEN');

      return next(null, db.System.fields.read(system, data));
    });
  },
  create: function (data, client, next) {
    if (!client.handshake.session) return next('UNAUTHORIZED');

    var system = db.System.fields.create(data);
    system.access = { edit: { users: [client.handshake.session._id] } };
    db.System.create(system, next);
  },
  update: function (data, client, next) {
    if (!client.handshake.session) return next('UNAUTHORIZED');

    db.System.findById(data._id, function (error, system) {
      if (error) return next(error);
      if (!system) return next('NOT_FOUND');
      if (!system.canBeEditedBy({ user: client.handshake.session._id })) return next('FORBIDDEN');

      _.extend(system, db.System.fields.update(data));
      system.save(next);
    });
  },
  destroy: function (data, client, next) {
    if (!client.handshake.session) return next('UNAUTHORIZED');

    db.System.findById(data._id, function (error, system) {
      if (error) return next(error);
      if (!system) return next('NOT_FOUND');
      if (!system.canBeEditedBy({ user: client.handshake.session._id })) return next('FORBIDDEN');

      system.remove(next);
    });
  }
};
