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
      if (!system) return next('NOT_FOUND');
      return next(error, system);
    });
  },
  create: function (params, client, next) {
    if (!client.session) return next('UNAUTHORIZED');

    var system = db.System.fields.create(params);
    system.access = { admin: client.session._id };
    db.System.create(system, function (error, system) {
      return next(error, system);
    });
  },
  update: function (params, client, next) {
    if (!client.session) return next('UNAUTHORIZED');

    db.System.findById(params._id).exec(function (error, system) {
      if (error) return next(error);
      if (!system) return next('NOT_FOUND');
      if (!system.canBeEditedBy(client.session._id)) return next('FORBIDDEN');

      system.set(db.System.fields.update(params));
      system.save(function (error) {
        return next(error, system);
      });
    });
  },
  delete: function (params, client, next) {
    if (!client.session) return next('UNAUTHORIZED');

    db.System.findById(params._id).exec(function (error, system) {
      if (error) return next(error);
      if (!system) return next('NOT_FOUND');
      if (!system.canBeEditedBy(client.session._id)) return next('FORBIDDEN');

      system.remove(function (error) {
        return next(error, params);
      });
    });
  }
};
