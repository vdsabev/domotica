// Allow access to all files in a folder under a common namespace

'use strict';

var path = require('path');

module.exports = function (folderPath, extension) {
  if (!folderPath) throw new Error('The `folderPath` parameter is required!');
  if (!extension) extension = '.js';

  var namespacePath = path.join(__dirname, folderPath);
  var namespace = {};

  var camelize = require('underscore.string/camelize');
  require('fs').readdirSync(namespacePath).forEach(function (fileNameAndExtension) {
    var extensionIndex = fileNameAndExtension.indexOf(extension, fileNameAndExtension.length - extension.length);
    if (extensionIndex !== -1) {
      var fileName = camelize(fileNameAndExtension.substring(0, extensionIndex));
      namespace[fileName] = require(path.join(namespacePath, fileNameAndExtension));
    }
  });

  return namespace;
};
