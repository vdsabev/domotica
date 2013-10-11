var _ = require('lodash');

var utils = module.exports = {
  // Object
  // ------------------------------
  processFields: function (fields) {
    if (!_.isArray(fields)) { // Infinite arguments
      fields = _.toArray(arguments);
    }

    return function (params, options) {
      var select = fields;

      if (options) {
        if (options.select) {
          select = _.intersection(select, options.select);
        }
      }

      if (_.isString(params)) return utils.join(select, params);
      if (_.isObject(params)) return utils.pick(params, select);
      return select;
    };
  },
  // Deep join objects using dot notation:
  // utils.join(['name', { fb: ['id'], db: ['test1', { test2: 'test3' }] }])
  // -> 'name fb.id db.test1 db.test2.test3'
  join: function (fields, separator, key) {
    if (separator == null) separator = ' ';

    var result = [];
    _.each(fields, function (field) {
      if (_.isString(field)) {
        result.push((key ? key + '.' : '') + field);
      }
      else if (_.isArray(field)) {
        result.push(utils.join(field, separator, key));
      }
      else if (_.isObject(field)) {
        _.each(field, function (childFields, childKey) {
          result.push(utils.join([childFields], separator, (key ? key + '.' : '') + childKey));
        });
      }
    });
    return result.join(separator);
  },
  // Deep pick objects:
  // utils.pick({ name: 'John', unwanted: 'field', fb: { id: '100001825159353', unwanted: 'field' } }, ['name', { fb: ['id'] }])
  // -> { name: 'John', fb: { id: '100001825159353' } }
  pick: function (params, fields) {
    var result = _.pick(params, fields);
    _.each(fields, function (field) {
      if (!_.isString(field) && _.isObject(field)) {
        _.each(field, function (fields, key) {
          result[key] = utils.pick(params[key], fields);
        });
      }
    });
    return result;
  }
};
