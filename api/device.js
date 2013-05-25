var _ = require('lodash'),
    db = require('../db');

module.exports = {
  index: function (data, client, next) {
    var query = db.Device.fields.query(data);
    var select = db.Device.fields.index(' ');
    var options = _.merge({ sort: { created: -1 } }, db.Device.fields.options(data), { lean: true });
    db.Device.find(query, select, options, next);
  },
  show: function (data, client, next) {
    db.Device.findById(data._id, db.Device.fields.show(' '), { lean: true }, function (error, device) {
      if (error) return next(error);
      if (!device) return next('NOT_FOUND');

      return next(null, device);
    });
  },
  create: function (data, client, next) {
    if (!client.handshake.session) return next('UNAUTHORIZED');

    var device = db.Device.fields.create(data);
    device.access = { admin: { users: [client.handshake.session._id] } };
    db.Device.create(device, next);
  },
  update: function (data, client, next) {
    if (!client.handshake.session) return next('UNAUTHORIZED');

    db.Device.findById(data._id).exec(function (error, device) {
      if (error) return next(error);
      if (!device) return next('NOT_FOUND');
      if (!device.canBeAdministeredBy({ user: client.handshake.session._id })) return next('FORBIDDEN');

      _.extend(device, db.Device.fields.update(data));
      device.save(next);
    });
  },
  destroy: function (data, client, next) {
    if (!client.handshake.session) return next('UNAUTHORIZED');

    db.Device.findById(data._id).exec(function (error, device) {
      if (error) return next(error);
      if (!device) return next('NOT_FOUND');
      if (!device.canBeAdministeredBy({ user: client.handshake.session._id })) return next('FORBIDDEN');

      device.remove(next);
    });
  }
};
