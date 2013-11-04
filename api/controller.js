var _ = require('lodash'),
    db = require('../db');

module.exports = {
  list: function (req, client, next) {
    var query = {
      $and: [
        db.Controller.fields.query(req.data),
        db.Controller.query.canBeViewedBy({ user: client.handshake.session && client.handshake.session._id })
      ]
    };
    var select = db.Controller.fields.read(' ', req.select);
    var options = _.merge({ sort: { created: -1 } }, db.Controller.fields.options(req.data), { lean: true });
    db.Controller.find(query, select, options, next);
  },
  view: function (req, client, next) {
    var select = db.Controller.fields.read(' ', req.select) + ' access';
    db.Controller.findById(req.data._id, select, function (error, controller) {
      if (error) return next(error);
      if (!controller) return next('NOT_FOUND');
      if (!controller.canBeViewedBy({ user: client.handshake.session && client.handshake.session._id })) return next('FORBIDDEN');

      if (req.join) {
        client.join('controller:' + req.data._id);
      }
      return next(null, _.extend(db.Controller.fields.read(controller, req.data), { editable: controller.canBeEditedBy({ user: client.handshake.session && client.handshake.session._id }) }));
    });
  },
  create: function (req, client, next) {
    if (!client.handshake.session) return next('UNAUTHORIZED');

    var controller = db.Controller.fields.create(req.data);
    controller.access = { edit: { users: [client.handshake.session._id] } };
    db.Controller.create(controller, next);
  },
  update: function (req, client, next) {
    if (!client.handshake.session) return next('UNAUTHORIZED');

    db.Controller.findById(req.data._id, function (error, controller) {
      if (error) return next(error);
      if (!controller) return next('NOT_FOUND');
      if (!controller.canBeEditedBy({ user: client.handshake.session._id })) return next('FORBIDDEN');

      _.extend(controller, db.Controller.fields.update(req.data));
      controller.save(function (error) {
        next(error);
        if (!error) {
          client.broadcast.to('controller:' + req.data._id).emit('controller:updated', req.data);
        }
      });
    });
  },
  destroy: function (req, client, next) {
    if (!client.handshake.session) return next('UNAUTHORIZED');

    db.Controller.findById(req.data._id, function (error, controller) {
      if (error) return next(error);
      if (!controller) return next('NOT_FOUND');
      if (!controller.canBeEditedBy({ user: client.handshake.session._id })) return next('FORBIDDEN');

      controller.remove(next);
    });
  }
};
