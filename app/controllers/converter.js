module.exports = {
  list: function (req, client, next) {
    var query = {
      $and: [
        db.Converter.fields.query(req.data),
        db.Converter.query.canBeViewedBy({ user: client.handshake.session && client.handshake.session._id })
      ]
    };
    var select = db.Converter.fields.read(' ', req.select);
    var options = _.merge({ sort: { created: -1 } }, db.Converter.fields.options(req.data), { lean: true });
    db.Converter.find(query, select, options, function (error, converters) {
      if (req.join) {
        _.each(converters, function (converter) {
          client.join('converter:' + converter._id);
        });
      }

      return next(error, converters);
    });
  },
  view: function (req, client, next) {
    var select = db.Converter.fields.read(' ', req.select) + ' access';
    db.Converter.findById(req.data._id, select, function (error, converter) {
      if (error) return next(error);
      if (!converter) return next('NOT_FOUND');
      if (!converter.canBeViewedBy({ user: client.handshake.session && client.handshake.session._id })) return next('FORBIDDEN');

      if (req.join) {
        client.join('converter:' + req.data._id, { replace: true });
      }
      return next(null, _.extend(db.Converter.fields.read(converter, req.data), { editable: converter.canBeEditedBy({ user: client.handshake.session && client.handshake.session._id }) }));
    });
  },
  create: function (req, client, next) {
    if (!client.handshake.session) return next('UNAUTHORIZED');

    var converter = db.Converter.fields.create(req.data);
    converter.access = { edit: { users: [client.handshake.session._id] } };
    db.Converter.create(converter, next);
  },
  update: function (req, client, next) {
    if (!client.handshake.session) return next('UNAUTHORIZED');

    db.Converter.findById(req.data._id, function (error, converter) {
      if (error) return next(error);
      if (!converter) return next('NOT_FOUND');
      if (!converter.canBeEditedBy({ user: client.handshake.session._id })) return next('FORBIDDEN');

      _.extend(converter, db.Converter.fields.update(req.data));
      converter.save(function (error) {
        next(error);
        if (!error) {
          client.broadcast.to('converter:' + req.data._id).emit('converter:updated', req.data);
        }
      });
    });
  },
  destroy: function (req, client, next) {
    if (!client.handshake.session) return next('UNAUTHORIZED');

    db.Converter.findById(req.data._id, function (error, converter) {
      if (error) return next(error);
      if (!converter) return next('NOT_FOUND');
      if (!converter.canBeEditedBy({ user: client.handshake.session._id })) return next('FORBIDDEN');

      converter.remove(next);
    });
  }
};
