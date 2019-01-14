'use strict';

const babel = require('babel-core');
const amdNameResolver = require('amd-name-resolver');
const CompactReexports = require('../lib');

QUnit.module('compact-reexports', function() {
  function transform(code, moduleOptions, moduleId) {
    const options = {
      moduleId: moduleId || 'bar',
      filename: `${moduleId}.js`,
      resolveModuleSource: amdNameResolver.moduleResolve,
      plugins: [
        ['transform-es2015-modules-amd', moduleOptions],
        [CompactReexports]
      ]
    };
    return babel.transform(code, options).code.trim();
  }

  QUnit.test('correctly transforms simple re-export', function(assert) {
    const result = transform('export { default } from "foo";');
    assert.equal(result, 'define.alias("foo", "bar");');
  });

  QUnit.test('correctly transforms simple re-export of nested path', function(assert) {
    const result = transform('export { default } from "some/path/to/foo";', undefined, 'other/path/to/bar');
    assert.equal(result, 'define.alias("some/path/to/foo", "other/path/to/bar");');
  });

  QUnit.test('correctly transforms simple re-export with loose', function(assert) {
    const result = transform('export { default } from "foo";', {
      loose: true
    });
    assert.equal(result, 'define.alias("foo", "bar");');
  });

  QUnit.test('correctly transforms simple re-export with strict', function(assert) {
    const result = transform('export { default } from "foo";', {
      strict: true
    });
    assert.equal(result, 'define.alias("foo", "bar");');
  });

  QUnit.test('correctly transforms simple re-export with noInterop', function(assert) {
    const result = transform('export { default } from "foo";', {
      noInterop: true
    });
    assert.equal(result, 'define.alias("foo", "bar");');
  });

  QUnit.test('correctly transforms re-export using relative paths', function(assert) {
    const result = transform('export { default } from "../components/foo-bar";', undefined, 'app/components/bar-foo');
    assert.equal(result, 'define.alias("app/components/foo-bar", "app/components/bar-foo");');
  });

  QUnit.test('correctly transforms re-export of module with more than one export', function(assert) {
    const result = transform('export { default, helper } from "foo";');
    assert.equal(result, 'define.alias("foo", "bar");');
  });

  QUnit.test('does not transform indirect re-export', function(assert) {
    const result = transform('import Foo from "foo"; export default Foo;');
    assert.equal(result.indexOf('define.alias'), -1);
  });

  QUnit.test('does not transform re-exports with other code', function(assert) {
    const result = transform('const a = "boo"; export { default } from "foo";');
    assert.equal(result.indexOf('define.alias'), -1);
  });

  QUnit.test('does not transform named re-exports', function (assert) {
    const result = transform('export { foo as bar } from "foo";');
    assert.equal(result.indexOf('define.alias'), -1)
  });
});
