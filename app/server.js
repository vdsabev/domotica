// Server configuration

module.exports = {
  config: function () {
    // Configure global variables
    global._ = require('lodash');
    global._.str = require('underscore.string');
    global.async = require('async');
    global.env = require('var');

    global.logger = require('./logger');
    global.services = require('./module')('services');
    global.controllers = require('./module')('controllers');
    global.db = require('./db');

    // Mark the server as configured to prevent calling
    // this unnecessarily when starting the server
    this._configured = true;

    return this;
  },
  destroy: function () {
    // Delete global variables
    _.each([
      '_', 'async', 'env',
      'logger', 'services', 'controllers', 'db'
    ], function (name) {
      delete global[name];
    });

    // Mark the server as destroyed
    this._destroyed = true;

    return this;
  },
  start: function () {
    if (!this._configured) {
      this.config();
    }

    var server = require('socket.io')(env.PORT);
    server.adapter(require('socket.io-redis')(env.redis));
    server.use(require('./auth'));

    server.on('connection', function (client) {
      // Custom join function to leave all rooms of the same type
      var join = client.join;
      client.join = function (roomName, callback, options) {
        // Switch arguments
        if (!_.isObject(options) && !_.isFunction(callback)) {
          options = callback;
          callback = undefined;
        }
        if (!_.isObject(options)) options = {};

        if (options.replace) {
          // Leave all other rooms except session
          for (var room in client.rooms) {
            if (room.indexOf('/session:') === -1) {
              client.leave(room.replace(/^\//, ''));
            }
          }
        }

        join.call(this, roomName, callback);
      };

      // General
      client.on('error', logger.error);

      // TODO: Make routing DRY
      // Converter
      route('get:converters', controllers.converter.list);
      route('get:converter', controllers.converter.view);
      route('create:converter', controllers.converter.create);
      route('update:converter', controllers.converter.update);
      route('destroy:converter', controllers.converter.destroy);

      // Device
      route('get:devices', controllers.device.list);
      route('get:device', controllers.device.view);
      route('create:device', controllers.device.create);
      route('update:device', controllers.device.update);
      route('destroy:device', controllers.device.destroy);

      // Session
      route('create:session', controllers.session.create);
      route('destroy:session', controllers.session.destroy);
      route('refresh:session', controllers.session.refresh);

      // Controller
      route('get:controllers', controllers.controller.list);
      route('get:controller', controllers.controller.view);
      route('create:controller', controllers.controller.create);
      route('update:controller', controllers.controller.update);
      route('destroy:controller', controllers.controller.destroy);

      // Users
      route('get:users', controllers.user.list);
      route('get:user', controllers.user.view);
      route('create:user', controllers.user.create);
      route('update:user', controllers.user.update);

      function route(eventName, fn) {
        client.on(eventName, function (req, next) {
          if (!req) req = {};
          if (!req.data) req.data = {};

          logger.info(eventName + ' ' + JSON.stringify(req.data));

          // TODO: Move authentication to `auth.js`
          if (eventName !== 'destroy:session') {
            if (!client.handshake.session && req[env.sessionKeyField]) { // Attempt to parse the session key
              client.handshake.session = controllers.session.decrypt(req[env.sessionKeyField]);
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

          fn(req, client, function (error, data) {
            if (error) {
              logger.error(error.stack || error);
              client.emit('error', error);
            }

            if (next) {
              if (!data) data = {};
              var res = { data: data };
              res[env.sessionKeyField] = controllers.session.encrypt(client.handshake.session);

              return next(error, res);
            }
          }, server);
        });
      }
    });

    logger.info('Server started on port', env.PORT);

    return this;
  }
};
