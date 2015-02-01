// Application entry script

var cluster = require('cluster');
if (cluster.isMaster) {
  // Fork workers.
  for (var i = 0; i < require('os').cpus().length; i++) {
    cluster.fork();
  }

  var logger = require('./app/logger');
  cluster.on('exit', function (worker, code, signal) {
    logger.error('Worker ' + worker.process.pid + ' died!');
    cluster.fork();
  });
}
else {
  require('./app/server').start();
}
