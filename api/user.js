var _ = require('lodash'),
    db = require('../db');

module.exports = {
  list: function (req, client, next) {
    var query = db.User.fields.query(req.data);
    var select = db.User.fields.read(' ', req.select);
    var options = _.merge({ sort: { created: -1 } }, db.User.fields.options(req.data), { lean: true });
    db.User.find(query, select, options, next);
  },
  view: function (req, client, next) {
    var select = db.User.fields.read(' ', req.select);
    db.User.findById(req.data._id, select, function (error, user) {
      if (error) return next(error);
      if (!user) return next('NOT_FOUND');

      if (req.join) {
        client.join('user:' + req.data._id);
      }
      return next(null, _.extend(db.User.fields.read(user, req.data), { editable: user.is(client.handshake.session && client.handshake.session._id) }));
    });
  },
  create: function (req, client, next) {
    var user = db.User.fields.create(req.data);

    // TODO: Validate password
    // if (!db.User.validate(user)) return next('BAD_REQUEST');

    user.password = db.User.encrypt(user, user.password);
    db.User.create(user, next);
  },
  update: function (req, client, next) {
    if (!client.handshake.session) return next('UNAUTHORIZED');
    if (req.data._id !== client.handshake.session.id) return next('FORBIDDEN');

    db.User.update({ _id: req.data._id }, db.User.fields.update(req.data), function (error) {
      next(error);
      if (!error) {
        client.broadcast.to('user:' + req.data._id).emit('user:updated', req.data);
      }
    });
  }
};
