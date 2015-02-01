module.exports = {
  create: function (req, client, next) {
    if (!_.isString(req.data.email)) return next('BAD_REQUEST');

    var query = { email: req.data.email.toLowerCase() };
    var select = '_id name email password salt';
    var options = { lean: true };
    db.User.findOne(query, select, options, function (error, user) {
      if (error) return next(error);
      if (!(user && db.User.authenticate(user, req.data.password))) return next('INVALID_LOGIN');

      client.handshake.session = _.extend(_.pick(user, '_id', 'name', 'email'), _.pick(req.data, 'remember'));
      client.join('session:' + client.handshake.session._id, { replace: true });

      if (!services.session.encrypt(client.handshake.session)) return next('BAD_REQUEST');

      return next(null, _.pick(user, '_id', 'name'));
    });
  },
  destroy: function (req, client, next) {
    client.handshake.session && client.leave('session:' + client.handshake.session._id);
    delete client.handshake.session;
    return next();
  },
  refresh: function (req, client, next) {
    return next();
  }
};
