'use strict';
const acorn = require('acorn');

module.exports = function acornParse(source) {
  return acorn.parse(source, {
    ecmaVersion: 8,
    sourceType: 'module',
  });
};
