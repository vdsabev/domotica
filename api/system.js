var _ = require('lodash'),
    db = require('../db');

module.exports = {
  index: function (params, client, next) {
    var query = db.System.fields.query(params);
    var select = db.System.fields.index(' ');
    var options = _.merge({ sort: { created: -1 } }, db.System.fields.options(params), { lean: true });
    db.System.find(query, select, options, next);
  },
  show: function (params, client, next) {
    db.System.findById(params._id, db.System.fields.show(' '), { lean: true }, function (error, system) {
      if (error) return next(error);
      if (!system) return next('NOT_FOUND');
      return next(null, system);
    });
  },
  create: function (params, client, next) {
    if (!client.handshake.session) return next('UNAUTHORIZED');

    var system = db.System.fields.create(params);
    system.access = { admin: client.handshake.session._id };
    db.System.create(system, next);
  },
  update: function (params, client, next) {
    if (!client.handshake.session) return next('UNAUTHORIZED');

    db.System.findById(params._id).exec(function (error, system) {
      if (error) return next(error);
      if (!system) return next('NOT_FOUND');
      if (!system.canBeEditedBy(client.handshake.session._id)) return next('FORBIDDEN');

      _.extend(system, db.System.fields.update(params));
      system.save(next);
    });
  },
  destroy: function (params, client, next) {
    if (!client.handshake.session) return next('UNAUTHORIZED');

    db.System.findById(params._id).exec(function (error, system) {
      if (error) return next(error);
      if (!system) return next('NOT_FOUND');
      if (!system.canBeEditedBy(client.handshake.session._id)) return next('FORBIDDEN');

      system.remove(next);
    });
  }
};
