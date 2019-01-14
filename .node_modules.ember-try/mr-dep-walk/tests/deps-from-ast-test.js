'use strict';

const expect = require('chai').expect;
const depsFromAST = require('../lib/deps-from-ast');
const defaultParser = require('../lib/default-parser');

function toAST(source) {
  return defaultParser(source);
}

describe('.depsFromAST', function() {
  describe('ES5', function() {
    const FOO = toAST(` define('foo', ['a', 'b/c'], function() { });`);
    const A = toAST(`define('a', ['exports', 'require'], function() { })`);
    const C = toAST(`define('c', ['../a', '../d'], function() { })`);
    const D = toAST(`define('d', ['foo'], function() { })`);

    it('extracts deps', function() {
      expect(depsFromAST(FOO)).to.eql(['a', 'b/c']);
      expect(depsFromAST(A)).to.eql([]);
      expect(depsFromAST(C)).to.eql(['../a', '../d']);
      expect(depsFromAST(D)).to.eql(['foo']);
    });
  });

  describe('ES6', function() {
    const FOO = toAST(`
import x from 'a';
import y from 'b/c';`);

    const A = toAST(``);
    const C = toAST(`
      import a from '../a';
      import d from '../d';
    `);
    const D = toAST(`import foo from 'foo';`);

    it('extracts deps', function() {
      expect(depsFromAST(FOO)).to.eql(['a', 'b/c']);
      expect(depsFromAST(A)).to.eql([]);
      expect(depsFromAST(C)).to.eql(['../a', '../d']);
      expect(depsFromAST(D)).to.eql(['foo']);
    });
  });

  describe('Compact Re-exports', function() {
    it('extracts dep', function() {
      const FOO = toAST(`;define.alias('foo', 'bar');`);
      expect(depsFromAST(FOO)).to.eql(['foo']);
    });

    it('does not choke on other stuff', function() {
      const FOO = toAST(`randomGlobalInvocation();myObject.method();`);
      expect(depsFromAST(FOO)).to.eql([]);
    });
  });

  describe('ES mixed with CR', function() {
    it('define then es6', function() {
      expect(
        depsFromAST(
          toAST(`
define('foo', ['bar'], function() { });
import x from 'a';
import y from 'b/c';
;define.alias('foo', 'bar');
      `)
        )
      ).to.eql(['bar']);
    });

    it('es6 then define', function() {
      expect(
        depsFromAST(
          toAST(`
import x from 'a';
import y from 'b/c';
define('foo', ['bar'], function() { });
;define.alias('foo', 'bar');
      `)
        )
      ).to.eql(['a', 'b/c']);
    });
  });

  it('CR then ES', function() {
    expect(
      depsFromAST(
        toAST(`
;define.alias('foo', 'bar');
import x from 'a';
import y from 'b/c';
define('foo', ['bar'], function() { });
      `)
      )
    ).to.eql(['foo']);
  });
});
