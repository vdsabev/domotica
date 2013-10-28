var env = require('var'),
    _ = require('lodash'),
    db = require('../db');

module.exports = {
  list: function (data, client, next) {
    var query = {
      $and: [
        db.Device.fields.query(data),
        db.Device.query.canBeViewedBy({ user: client.handshake.session && client.handshake.session._id })
      ]
    };
    if (_.has(data.select, 'values')) {
      query.values = { $slice: -env.limit };
    }
    var select = db.Device.fields.read(' ', data);
    var options = _.merge({ sort: { created: -1 } }, db.Device.fields.options(data), { lean: true });
    db.Device.find(query, select, options, next);
  },
  view: function (data, client, next) {
    var query = { _id: data._id };
    if (_.has(data.select, 'values')) {
      query.values = { $slice: -env.limit };
    }
    var select = db.Device.fields.read(' ', data) + ' access';

    db.Device.findOne(query, select, function (error, device) {
      if (error) return next(error);
      if (!device) return next('NOT_FOUND');
      if (!device.canBeViewedBy({ user: client.handshake.session && client.handshake.session._id })) return next('FORBIDDEN');

      client.join('device:' + data._id);
      return next(null, _.extend(db.Device.fields.read(device, data), { editable: device.canBeEditedBy({ user: client.handshake.session && client.handshake.session._id }) }));
    });
  },
  create: function (data, client, next) {
    if (!client.handshake.session) return next('UNAUTHORIZED');

    var device = db.Device.fields.create(data);
    device.access = { edit: { users: [client.handshake.session._id] } };
    db.Device.create(device, next);
  },
  update: function (data, client, next) {
    if (!client.handshake.session) return next('UNAUTHORIZED');

    db.Device.findById(data._id, function (error, device) {
      if (error) return next(error);
      if (!device) return next('NOT_FOUND');
      if (!device.canBeEditedBy({ user: client.handshake.session._id })) return next('FORBIDDEN');

      var update = db.Device.fields.update(data);

      // Custom fields
      if (data.values) { // TODO: Validate data
        update.values = { $pushAll: data.values };
      }

      db.Device.update({ _id: device._id }, update, function (error) {
        next(error);
        if (!error) {
          client.broadcast.to('device:' + data._id).emit('device:updated', data);
        }
      });
    });
  },
  destroy: function (data, client, next) {
    if (!client.handshake.session) return next('UNAUTHORIZED');

    db.Device.findById(data._id, function (error, device) {
      if (error) return next(error);
      if (!device) return next('NOT_FOUND');
      if (!device.canBeEditedBy({ user: client.handshake.session._id })) return next('FORBIDDEN');

      device.remove(next);
    });
  }
};
