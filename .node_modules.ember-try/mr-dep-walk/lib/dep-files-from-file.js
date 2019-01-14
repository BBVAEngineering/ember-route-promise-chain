'use strict';

const depsFromFile = require('./deps-from-file');
const path = require('path');
const amdNameResolver = require('amd-name-resolver');

module.exports = function depFilesFromFile(root, options, _files) {
  let files = _files || [];
  let file = options.entry;
  let cwd = options.cwd || '';
  let deps = depsFromFile(path.join(root, cwd, file), {
    parse: options.parse,
  });

  for (let i = 0; i < deps.length; i++) {
    let dep = deps[i];
    let resolved = amdNameResolver.moduleResolve(dep, file);
    let dependency = resolved + '.js';
    let fullDependency = cwd ? cwd + '/' + dependency : dependency;

    if (
      Array.isArray(options.external) &&
      options.external.indexOf(resolved) > -1
    ) {
      continue;
    }

    if (files.indexOf(fullDependency) === -1) {
      files.push(fullDependency);

      depFilesFromFile(
        root,
        {
          cwd: cwd,
          entry: dependency,
          external: options.external,
          parse: options.parse,
        },
        files
      );
    }
  }

  return files;
};
