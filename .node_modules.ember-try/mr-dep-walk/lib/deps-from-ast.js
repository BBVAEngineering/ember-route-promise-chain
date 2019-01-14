'use strict';

// lifted from: https://github.com/ef4/ember-browserify/blob/master/lib/stubs.js (EF4 deserves credit);
//
const STOP = {};
function forEachNode(node, visit) {
  if (node && typeof node === 'object' && !node._eb_visited) {
    node._eb_visited = true;
    let shouldStop = visit(node);
    if (STOP === shouldStop) {
      return STOP;
    }
    let keys = Object.keys(node);
    for (let i = 0; i < keys.length; i++) {
      let shouldStop = forEachNode(node[keys[i]], visit);
      if (STOP === shouldStop) {
        return STOP;
      }
    }
  }
}

module.exports = function depsFromAST(ast) {
  // TODO: add a persistent cache
  let imports = [];

  let hasImportDeclaration = false;

  forEachNode(ast, function(entry) {
    if (entry.type === 'ImportDeclaration') {
      hasImportDeclaration = true;
      let value = entry.source.value;
      if (value === 'exports' || value === 'require') {
        return;
      }
      imports.push(value);
    }

    if (hasImportDeclaration) {
      return;
    }

    if (entry.type === 'CallExpression') {
      if (entry.callee.name === 'define') {
        for (let i = 0; i < entry.arguments.length; i++) {
          let item = entry.arguments[i];
          if (item.type === 'ArrayExpression') {
            for (let j = 0; j < item.elements.length; j++) {
              let element = item.elements[j];
              let value = element.value;
              if (value !== 'exports' && value !== 'require') {
                imports.push(value);
              }
            }
            return STOP;
          }
        }
      } else if (
        entry.callee.type === 'MemberExpression' &&
        entry.callee.object.name === 'define' &&
        entry.callee.property.name === 'alias'
      ) {
        imports.push(entry.arguments[0].value);
      }
      return STOP;
    }
  });

  return imports;
};
