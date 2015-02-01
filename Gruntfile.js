'use strict';

module.exports = function (grunt) {
  // Load grunt tasks automatically
  require('load-grunt-tasks')(grunt);

  // Time how long tasks take. Can help when optimizing build times
  require('time-grunt')(grunt);

  // Define the configuration for all the tasks
  grunt.initConfig({
    // Environment variables
    env: { development: JSON.parse(require('fs').readFileSync('.env', { encoding: 'utf8' })) },

    nodeunit: {
      all: ['tests/**/*.js']
    },

    // Shell
    shell: {
      node: { command: function (args) { return 'node' + (' ' + args || ''); } }
    }
  });

  // Run scripts in the `tasks` folder: `grunt task:test`
  grunt.registerTask('task', function (task) {
    grunt.task.run([
      'env:development', // Override environment variables from `env.json`
      'shell:node' + (task ? ':tasks/' + task : '')
    ]);
  });
};
