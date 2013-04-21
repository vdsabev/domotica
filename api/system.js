var _ = require('lodash'),
    db = require('../db');

module.exports = {
  index: function (data, client, next) {
    var query = db.System.fields.query(data);
    var select = db.System.fields.index(' ');
    var options = _.merge({ sort: { created: -1 } }, db.System.fields.options(data), { lean: true });
    db.System.find(query, select, options, next);
  },
  show: function (data, client, next) {
    db.System.findById(data._id, db.System.fields.show(' '), { lean: true }, function (error, system) {
      if (error) return next(error);
      if (!system) return next('NOT_FOUND');
      return next(null, system);
    });
  },
  create: function (data, client, next) {
    if (!client.handshake.session) return next('UNAUTHORIZED');

    var system = db.System.fields.create(data);
    system.access = { admin: client.handshake.session._id };
    db.System.create(system, next);
  },
  update: function (data, client, next) {
    if (!client.handshake.session) return next('UNAUTHORIZED');

    db.System.findById(data._id).exec(function (error, system) {
      if (error) return next(error);
      if (!system) return next('NOT_FOUND');
      if (!system.canBeEditedBy(client.handshake.session._id)) return next('FORBIDDEN');

      _.extend(system, db.System.fields.update(data));
      system.save(next);
    });
  },
  destroy: function (data, client, next) {
    if (!client.handshake.session) return next('UNAUTHORIZED');

    db.System.findById(data._id).exec(function (error, system) {
      if (error) return next(error);
      if (!system) return next('NOT_FOUND');
      if (!system.canBeEditedBy(client.handshake.session._id)) return next('FORBIDDEN');

      system.remove(next);
    });
  }
};
