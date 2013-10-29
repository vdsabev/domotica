var env = require('var'),
    _ = require('lodash'),
    controller = require('./api/controller'),
    converter = require('./api/converter'),
    device = require('./api/device'),
    session = require('./api/session'),
    user = require('./api/user');

// Create Server
var server = require('socket.io').listen(env.port);
server.set('log level', env.logLevel);
server.sockets.on('connection', function (client) {
  // Custom join function to leave all rooms of the same type
  var join = client.join;
  client.join = function () {
    // Leave all other rooms, except session
    var clientRooms = server.sockets.manager.roomClients[client.id];
    for (var room in clientRooms) {
      if (room && room.indexOf('/session:') === -1) {
        client.leave(room.replace(/^\//, ''));
      }
    }

    join.apply(this, arguments);
  };

  // General
  client.on('error', function (error) {
    console.error(error.stack || error);
  });

  // Converter
  client.on('get:converters', call(converter.list));
  client.on('get:converter', call(converter.view));
  client.on('create:converter', call(converter.create));
  client.on('update:converter', call(converter.update));
  client.on('destroy:converter', call(converter.destroy));

  // Device
  client.on('get:devices', call(device.list));
  client.on('get:device', call(device.view));
  client.on('create:device', call(device.create));
  client.on('update:device', call(device.update));
  client.on('destroy:device', call(device.destroy));

  // Session
  client.on('create:session', call(session.create));
  client.on('destroy:session', call(session.destroy));
  client.on('refresh:session', call(session.refresh));

  // Controller
  client.on('get:controllers', call(controller.list));
  client.on('get:controller', call(controller.view));
  client.on('create:controller', call(controller.create));
  client.on('update:controller', call(controller.update));
  client.on('destroy:controller', call(controller.destroy));

  // Users
  client.on('get:users', call(user.list));
  client.on('get:user', call(user.view));
  client.on('create:user', call(user.create));
  client.on('update:user', call(user.update));

  function call(fn) {
    return function (req, next) {
      if (!req) req = {};
      if (!req.data) req.data = {};

      if (fn !== session.destroy) {
        if (!client.handshake.session && req[env.sessionKeyField]) { // Attempt to parse the session key
          client.handshake.session = session.decrypt(req[env.sessionKeyField]);
          if (!client.handshake.session) {
            client.emit('error', 'BAD_REQUEST');
            return next('BAD_REQUEST');
          }
        }

        if (client.handshake.session) { // Check session expiration
          var sessionLength = new Date().getTime() - client.handshake.session.timestamp;
          var maxSessionLength = client.handshake.session.remember ? env.maxExtendedSessionLength : env.maxSessionLength;
          if (sessionLength > maxSessionLength) {
            client.emit('error', 'SESSION_EXPIRED');
            return next('SESSION_EXPIRED');
          }
        }
      }

      fn(req.data, client, function (error, data) {
        if (error) {
          console.error(error.stack || error);
          client.emit('error', error);
        }

        if (next) {
          if (!data) data = {};
          var res = { data: data };
          res[env.sessionKeyField] = session.encrypt(client.handshake.session);

          return next(error, res);
        }
      }, server);
    };
  }
});

console.log('Server started on port', env.port);
if (env.logLevel > 1) {
  console.log(env);
}
