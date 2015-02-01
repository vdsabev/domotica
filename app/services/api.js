// API related services

'use strict';

var api = module.exports = {
  processFields: function (fields) {
    if (!_.isArray(fields)) { // Infinite arguments
      fields = _.toArray(arguments);
    }

    return function (params, options) {
      var select = fields;

      if (options) {
        var filters = [];

        if (options.select) {
          filters = options.select;
        }
        if (options.populate) {
          filters = _.union(filters, _.transform(options.populate, function (result, field) {
            if (_.isObject(field)) {
              result = result.concat(_.keys(field));
            }
            else {
              result.push(field);
            }
          }));
        }

        if (filters.length !== 0) {
          select = _.intersection(fields, filters);
        }
      }

      if (_.isString(params)) return api.join(select, params);
      if (_.isObject(params)) return api.pick(params, select);

      return select;
    };
  },
  // Deep join objects using dot notation:
  // api.join(['name', { fb: ['id'], db: ['test1', { test2: 'test3' }] }])
  // -> 'name fb.id db.test1 db.test2.test3'
  join: function (fields, separator, key) {
    if (separator == null) separator = ' ';

    var result = [];
    _.each(fields, function (field) {
      if (_.isString(field)) {
        result.push((key ? key + '.' : '') + field);
      }
      else if (_.isArray(field)) {
        result.push(api.join(field, separator, key));
      }
      else if (_.isObject(field)) {
        _.each(field, function (childFields, childKey) {
          result.push(api.join([childFields], separator, (key ? key + '.' : '') + childKey));
        });
      }
    });
    return result.join(separator);
  },
  // Deep pick objects:
  // api.pick({ name: 'John', unwanted: 'field', fb: { id: '100001825159353', unwanted: 'field' } }, ['name', { fb: ['id'] }])
  // -> { name: 'John', fb: { id: '100001825159353' } }
  pick: function (params, fields) {
    if (!_.isArray(fields)) { // Infinite arguments
      fields = _.toArray(arguments).slice(1);
    }

    var result = _.pick(params, fields);
    _.each(fields, function (field) {
      if (!_.isString(field) && _.isObject(field)) {
        _.each(field, function (fields, key) {
          result[key] = api.pick(params[key], fields);
        });
      }
    });
    return result;
  }
};
