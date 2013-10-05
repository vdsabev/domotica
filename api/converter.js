var _ = require('lodash'),
    db = require('../db');

module.exports = {
  index: function (data, client, next) {
    var query = db.Converter.fields.query(data);
    var select = db.Converter.fields.index(' ');
    var options = _.merge({ sort: { created: -1 } }, db.Converter.fields.options(data), { lean: true });
    db.Converter.find(query, select, options, next);
  },
  show: function (data, client, next) {
    var select = db.Converter.fields.show(' ');
    var options = { lean: true };
    db.Converter.findById(data._id, select, options, function (error, converter) {
      if (error) return next(error);
      if (!converter) return next('NOT_FOUND');

      return next(null, converter);
    });
  },
  create: function (data, client, next) {
    if (!client.handshake.session) return next('UNAUTHORIZED');

    var converter = db.Converter.fields.create(data);
    converter.access = { admin: { users: [client.handshake.session._id] } };
    db.Converter.create(converter, next);
  },
  update: function (data, client, next) {
    if (!client.handshake.session) return next('UNAUTHORIZED');

    db.Converter.findById(data._id, function (error, converter) {
      if (error) return next(error);
      if (!converter) return next('NOT_FOUND');
      if (!converter.canBeAdministeredBy({ user: client.handshake.session._id })) return next('FORBIDDEN');

      _.extend(converter, db.Converter.fields.update(data));
      converter.save(next);
    });
  },
  destroy: function (data, client, next) {
    if (!client.handshake.session) return next('UNAUTHORIZED');

    db.Converter.findById(data._id, function (error, converter) {
      if (error) return next(error);
      if (!converter) return next('NOT_FOUND');
      if (!converter.canBeAdministeredBy({ user: client.handshake.session._id })) return next('FORBIDDEN');

      converter.remove(next);
    });
  }
};
