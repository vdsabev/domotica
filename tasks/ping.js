// Periodically send data to the socket server

'use strict';

// Connect to server
var env = require('var'),
    intervalID;

console.log('connecting to %s...', env.host);
var server = require('socket.io-client').connect(env.host);

server.on('error', console.error);

server.on('connect', function () {
  console.log('...connected');
  console.log('logging in as %s...', env.email);
  server.emit('create:session', { data: { email: env.email, password: env.password } }, function (error, session) {
    if (error) {
      console.error(error);
      process.exit(1);
    }

    console.log('...logged in');
    clearInterval(intervalID);
    intervalID = setInterval(function () {
      var now = new Date().toISOString();
      var update = { data: { _id: session.data._id, description: now } };
      update[env.sessionKeyField] = session[env.sessionKeyField];
      console.log('update:user ' + JSON.stringify(update.data));
      server.emit('update:user', update, function (error, res) {
        if (error) console.error(error);
        session[env.sessionKeyField] = res[env.sessionKeyField];
      });
    }, 3e3);
  });
});

server.on('disconnect', function () {
  console.log('...disconnected from %s', env.host);
  clearInterval(intervalID);
});
