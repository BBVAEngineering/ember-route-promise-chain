'use strict';

const expect = require('chai').expect;
const depsFromSrouce = require('../lib/deps-from-source');
const defaultParser = require('../lib/default-parser');

describe('.depsFromSource', function() {
  describe('ES5', function() {
    const FOO = ` define('foo', ['a', 'b/c'], function() { });`;
    const A = `define('a', ['exports', 'require'], function() { })`;
    const C = `define('c', ['../a', '../d'], function() { })`;
    const D = `define('d', ['foo'], function() { })`;

    it('extracts deps', function() {
      expect(depsFromSrouce(FOO)).to.eql(['a', 'b/c']);
      expect(depsFromSrouce(A)).to.eql([]);
      expect(depsFromSrouce(C)).to.eql(['../a', '../d']);
      expect(depsFromSrouce(D)).to.eql(['foo']);
    });
  });

  describe('ES6', function() {
    const FOO = `
import x from 'a';
import y from 'b/c';`;

    const A = ``;
    const C = `
      import a from '../a';
      import d from '../d';
    `;
    const D = `import foo from 'foo';`;

    it('extracts deps', function() {
      expect(depsFromSrouce(FOO)).to.eql(['a', 'b/c']);
      expect(depsFromSrouce(A)).to.eql([]);
      expect(depsFromSrouce(C)).to.eql(['../a', '../d']);
      expect(depsFromSrouce(D)).to.eql(['foo']);
    });
  });

  describe('ES mixed', function() {
    it('define then es6', function() {
      expect(
        depsFromSrouce(`
define('foo', ['bar'], function() { });
import x from 'a';
import y from 'b/c';
      `)
      ).to.eql(['bar']);
    });

    it('es6 then define', function() {
      expect(
        depsFromSrouce(`
import x from 'a';
import y from 'b/c';
define('foo', ['bar'], function() { });
      `)
      ).to.eql(['a', 'b/c']);
    });
  });

  describe('pluggable parse', function() {
    it('provide alternative parser', function() {
      let parseCount = 0;
      expect(
        depsFromSrouce(
          `
import x from 'a';
import y from 'b/c';
      `,
          {
            parse(source) {
              parseCount++;
              return defaultParser(source);
            },
          }
        )
      ).to.eql(['a', 'b/c']);

      expect(parseCount).to.eql(1);
    });
  });
});
