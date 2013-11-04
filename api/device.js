var env = require('var'),
    _ = require('lodash'),
    db = require('../db');

module.exports = {
  list: function (req, client, next) {
    var query = {
      $and: [
        db.Device.fields.query(req.data),
        db.Device.query.canBeViewedBy({ user: client.handshake.session && client.handshake.session._id })
      ]
    };
    if (_.has(req.select, 'values')) {
      query.values = { $slice: -env.limit };
    }
    var select = db.Device.fields.read(' ', req.select);
    var options = _.merge({ sort: { created: -1 } }, db.Device.fields.options(req.data), { lean: true });

    var q = db.Device.find(query, select, options);
    _.each(req.select, function (item) {
      if (_.isObject(item)) {
        _.each(item, function (populate, field) {
          var model;
          switch (field) {
            case 'controller':
              model = 'Controller';
              break;
            case 'converter':
              model = 'Converter';
              break;
          }

          if (model) {
            q.populate(field, db[model].fields.read(' ', populate));
          }
        });
      }
    });
    q.exec(next);
  },
  view: function (req, client, next) {
    var query = { _id: req.data._id };
    if (_.has(req.select, 'values')) {
      query.values = { $slice: -env.limit };
    }
    var select = db.Device.fields.read(' ', req.select) + ' access';

    db.Device.findOne(query, select, function (error, device) {
      if (error) return next(error);
      if (!device) return next('NOT_FOUND');
      if (!device.canBeViewedBy({ user: client.handshake.session && client.handshake.session._id })) return next('FORBIDDEN');

      if (req.join) {
        client.join('device:' + req.data._id);
      }
      return next(null, _.extend(db.Device.fields.read(device, req.data), { editable: device.canBeEditedBy({ user: client.handshake.session && client.handshake.session._id }) }));
    });
  },
  create: function (req, client, next) {
    if (!client.handshake.session) return next('UNAUTHORIZED');

    var device = db.Device.fields.create(req.data);
    device.access = { edit: { users: [client.handshake.session._id] } };
    db.Device.create(device, next);
  },
  update: function (req, client, next) {
    if (!client.handshake.session) return next('UNAUTHORIZED');

    db.Device.findById(req.data._id, function (error, device) {
      if (error) return next(error);
      if (!device) return next('NOT_FOUND');
      if (!device.canBeEditedBy({ user: client.handshake.session._id })) return next('FORBIDDEN');

      var update = db.Device.fields.update(req.data);
      if (req.data.values) {
        if (!_.isArray(req.data.values)) return next('BAD_REQUEST');
        if (_.isArray(_.first(req.data.values))) { // Push array of values
          _.each(req.data.values, function (value) {
            if (!_.isDate(value[0])) {
              value[0] = new Date(value[0]);
            }
          });
          update.$pushAll = _.pick(req.data, 'values');
        }
        else { // Push one value
          if (!_.isDate(req.data.values[0])) {
            req.data.values[0] = new Date(req.data.values[0]);
          }
          update.$push = _.pick(req.data, 'values');
        }
      }

      db.Device.update({ _id: req.data._id }, update, function (error) {
        next(error);
        if (!error) {
          client.broadcast.to('device:' + req.data._id).emit('device:updated', req.data);
        }
      });
    });
  },
  destroy: function (req, client, next) {
    if (!client.handshake.session) return next('UNAUTHORIZED');

    db.Device.findById(req.data._id, function (error, device) {
      if (error) return next(error);
      if (!device) return next('NOT_FOUND');
      if (!device.canBeEditedBy({ user: client.handshake.session._id })) return next('FORBIDDEN');

      device.remove(next);
    });
  }
};
