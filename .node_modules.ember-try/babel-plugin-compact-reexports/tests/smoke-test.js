'use strict';

const path = require('path');
const fs = require('fs');
const vm = require('vm');

const babel = require('babel-core');
const CompactReexports = require('../lib');

const fixturePath = path.join(__dirname, 'fixtures', 'smoke');

QUnit.module('compact-reexports - smoke', function() {
  QUnit.test('correctly transforms simple re-export', function(assert) {
    // Compile code
    function compile(module) {
      return babel.transformFileSync(path.join(fixturePath, `${module}.js`), {
        moduleId: module,
        plugins: [
          ['transform-es2015-modules-amd'],
          [CompactReexports]
        ]
      }).code;
    }

    const originalModule = compile('original');
    const reexportModule = compile('reexport');

    assert.equal(originalModule.indexOf('define.alias'), -1);
    assert.equal(reexportModule, 'define.alias("original", "reexport");');

    // Load code into vm sandbox with loader.js
    const sandbox = {};

    const loaderjs = fs.readFileSync(require.resolve('loader.js'), 'utf8');

    vm.createContext(sandbox);
    vm.runInContext(loaderjs, sandbox);
    vm.runInContext(originalModule, sandbox);
    vm.runInContext(reexportModule, sandbox);

    // Verify original and reexport modules are the same reference
    assert.strictEqual(sandbox.require('original'), sandbox.require('reexport'));
  });
});
