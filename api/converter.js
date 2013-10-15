var _ = require('lodash'),
    db = require('../db');

module.exports = {
  list: function (data, client, next) {
    var query = {
      $and: [
        db.Converter.fields.query(data),
        db.Converter.query.canBeViewedBy({ user: client.handshake.session && client.handshake.session._id })
      ]
    };
    var select = db.Converter.fields.read(' ', data);
    var options = _.merge({ sort: { created: -1 } }, db.Converter.fields.options(data), { lean: true });
    db.Converter.find(query, select, options, next);
  },
  view: function (data, client, next) {
    var select = db.Converter.fields.read(' ', data) + ' access';
    db.Converter.findById(data._id, select, function (error, converter) {
      if (error) return next(error);
      if (!converter) return next('NOT_FOUND');
      if (!converter.canBeViewedBy({ user: client.handshake.session && client.handshake.session._id })) return next('FORBIDDEN');

      return next(null, _.extend(db.Converter.fields.read(converter, data), { editable: converter.canBeEditedBy({ user: client.handshake.session && client.handshake.session._id }) }));
    });
  },
  create: function (data, client, next) {
    if (!client.handshake.session) return next('UNAUTHORIZED');

    var converter = db.Converter.fields.create(data);
    converter.access = { edit: { users: [client.handshake.session._id] } };
    db.Converter.create(converter, next);
  },
  update: function (data, client, next) {
    if (!client.handshake.session) return next('UNAUTHORIZED');

    db.Converter.findById(data._id, function (error, converter) {
      if (error) return next(error);
      if (!converter) return next('NOT_FOUND');
      if (!converter.canBeEditedBy({ user: client.handshake.session._id })) return next('FORBIDDEN');

      _.extend(converter, db.Converter.fields.update(data));
      converter.save(next);
    });
  },
  destroy: function (data, client, next) {
    if (!client.handshake.session) return next('UNAUTHORIZED');

    db.Converter.findById(data._id, function (error, converter) {
      if (error) return next(error);
      if (!converter) return next('NOT_FOUND');
      if (!converter.canBeEditedBy({ user: client.handshake.session._id })) return next('FORBIDDEN');

      converter.remove(next);
    });
  }
};
