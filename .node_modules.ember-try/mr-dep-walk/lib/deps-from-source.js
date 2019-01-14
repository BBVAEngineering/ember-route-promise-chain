'use strict';

const depsFromAST = require('./deps-from-ast');
const defaultParser = require('./default-parser');

module.exports = function depsFromSource(source, _options) {
  let options = _options || {};
  let parse = options.parse || defaultParser;

  return depsFromAST(
    parse(source, {
      ecmaVersion: 8,
      sourceType: 'module',
    })
  );
};
