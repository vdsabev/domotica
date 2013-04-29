var _ = require('lodash'),
    db = require('../db');

module.exports = {
  index: function (data, client, next) {
    var query = db.Unit.fields.query(data);
    var select = db.Unit.fields.index(' ');
    var options = _.merge({ sort: { created: -1 } }, db.Unit.fields.options(data), { lean: true });
    db.Unit.find(query, select, options, next);
  },
  show: function (data, client, next) {
    db.Unit.findById(data._id, db.Unit.fields.show(' '), { lean: true }, function (error, unit) {
      if (error) return next(error);
      if (!unit) return next('NOT_FOUND');
      return next(null, unit);
    });
  },
  create: function (data, client, next) {
    if (!client.handshake.session) return next('UNAUTHORIZED');

    var unit = db.Unit.fields.create(data);
    unit.admins = [client.handshake.session._id];
    db.Unit.create(unit, next);
  },
  update: function (data, client, next) {
    if (!client.handshake.session) return next('UNAUTHORIZED');

    db.Unit.findById(data._id).exec(function (error, unit) {
      if (error) return next(error);
      if (!unit) return next('NOT_FOUND');
      if (!unit.canBeAdministeredBy(client.handshake.session._id)) return next('FORBIDDEN');

      _.extend(unit, db.Unit.fields.update(data));
      unit.save(next);
    });
  },
  destroy: function (data, client, next) {
    if (!client.handshake.session) return next('UNAUTHORIZED');

    db.Unit.findById(data._id).exec(function (error, unit) {
      if (error) return next(error);
      if (!unit) return next('NOT_FOUND');
      if (!unit.canBeAdministeredBy(client.handshake.session._id)) return next('FORBIDDEN');

      unit.remove(next);
    });
  }
};
