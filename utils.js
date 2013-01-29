var _ = require('lodash');

module.exports = {
  processFields: function (fields) {
    return function (params) {
      if (_.isObject(params)) return _.pick(params, fields);
      if (_.isString(params)) return fields.join(params);
      return fields;
    };
  }
};
