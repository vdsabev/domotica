var _ = require('lodash'),
    db = require('../db');

module.exports = {
  list: function (data, client, next) {
    var query = {
      $and: [
        db.Controller.fields.query(data),
        db.Controller.query.canBeViewedBy({ user: client.handshake.session && client.handshake.session._id })
      ]
    };
    var select = db.Controller.fields.read(' ', data);
    var options = _.merge({ sort: { created: -1 } }, db.Controller.fields.options(data), { lean: true });
    db.Controller.find(query, select, options, next);
  },
  view: function (data, client, next) {
    var select = db.Controller.fields.read(' ', data) + ' access';
    db.Controller.findById(data._id, select, function (error, controller) {
      if (error) return next(error);
      if (!controller) return next('NOT_FOUND');
      if (!controller.canBeViewedBy({ user: client.handshake.session && client.handshake.session._id })) return next('FORBIDDEN');

      return next(null, _.extend(db.Controller.fields.read(controller, data), { editable: controller.canBeEditedBy({ user: client.handshake.session && client.handshake.session._id }) }));
    });
  },
  create: function (data, client, next) {
    if (!client.handshake.session) return next('UNAUTHORIZED');

    var controller = db.Controller.fields.create(data);
    controller.access = { edit: { users: [client.handshake.session._id] } };
    db.Controller.create(controller, next);
  },
  update: function (data, client, next) {
    if (!client.handshake.session) return next('UNAUTHORIZED');

    db.Controller.findById(data._id, function (error, controller) {
      if (error) return next(error);
      if (!controller) return next('NOT_FOUND');
      if (!controller.canBeEditedBy({ user: client.handshake.session._id })) return next('FORBIDDEN');

      _.extend(controller, db.Controller.fields.update(data));
      controller.save(next);
    });
  },
  destroy: function (data, client, next) {
    if (!client.handshake.session) return next('UNAUTHORIZED');

    db.Controller.findById(data._id, function (error, controller) {
      if (error) return next(error);
      if (!controller) return next('NOT_FOUND');
      if (!controller.canBeEditedBy({ user: client.handshake.session._id })) return next('FORBIDDEN');

      controller.remove(next);
    });
  }
};
