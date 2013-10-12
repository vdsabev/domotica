var _ = require('lodash'),
    async = require('async'),
    should = require('should');

// Declare utility functions
String.prototype.repeat = function (count) {
  return new Array(count + 1).join(this);
};

// Include test files
var tests = {};
var path = './tests';
_.each(require('fs').readdirSync(path), function (file) {
  tests[file] = require(path + '/' + file);
});

// Start tests
var results = { passed: 0, failed: 0, skipped: 0 };
async.series(_.map(tests, function (test, file) {
  return function (next) {
    console.log('\n' + file + ':');
    execute(next, test);
  };
}), function (error) {
  if (error) throw new Error(error);

  var passed = 'PASSED: ' + results.passed;
  var failed = 'FAILED: ' + results.failed;
  var skipped = 'SKIPPED: ' + results.skipped;

  console.log('╔'  + '═'.repeat(passed.length + 2) +  '╦'  + '═'.repeat(failed.length + 2) +  '╦'  + '═'.repeat(skipped.length + 2) +  '╗');
  console.log('║ ' +            passed             + ' ║ ' +            failed             + ' ║ ' +            skipped             + ' ║');
  console.log('╚'  + '═'.repeat(passed.length + 2) +  '╩'  + '═'.repeat(failed.length + 2) +  '╩'  + '═'.repeat(skipped.length + 2) +  '╝');

  process.exit(0);
});

function execute(next, test, key, indent) {
  if (key !== undefined ) { // Log test structure
    if (isNaN(indent)) indent = 2;
    console.log(' '.repeat(indent) + key + (_.isFunction(test) ? '' : ':'));
  }

  if (_.isFunction(test)) { // Execute test
    try {
      test(function (status) {
        if (status === 'skip') {
          var message = ' '.repeat(indent - 1) + 'SKIPPED';
          console.log('┌─' + '─'.repeat(message.length) +  '┐');
          console.log('►' +             message         + ' │');
          console.log('└─' + '─'.repeat(message.length) +  '┘');
          results.skipped++;
        }
        else {
          results.passed++;
        }

        next();
      });
    }
    catch (error) {
      var message = ' '.repeat(indent - 1) + 'FAILED: ' + (error && error.message || error || 'unknown error');
      console.log('┌─' + '─'.repeat(message.length) +  '┐');
      console.log('X' +             message         + ' │');
      console.log('└─' + '─'.repeat(message.length) +  '┘');
      results.failed++;
      next();
    }
  }
  else if (_.isObject(test)) {
    async.series(_.map(test, function (child, key) {
      return function (next) {
        execute(next, child, key, indent + 2);
      };
    }), next);
  }
  else return next('INVALID TEST FILE STRUCTURE');
}
