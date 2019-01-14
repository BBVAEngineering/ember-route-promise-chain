'use strict';

const fixturify = require('fixturify');
const fs = require('fs-extra');
const ROOT = __dirname + '/fixtures/';

const expect = require('chai').expect;
const depsFromFile = require('../lib/deps-from-file');
const defaultParser = require('../lib/default-parser');

describe('.depsFromFile', function() {
  describe('ES5', function() {
    beforeEach(function() {
      fs.removeSync(ROOT);
      fixturify.writeSync(ROOT + 'es5', {
        'foo.js': ` define('foo', ['a', 'b/c'], function() { });`,
        'a.js': `define('a', ['exports', 'require'], function() { })`,
        b: {
          'c.js': `define('c', ['../a', '../d'], function() { })`,
        },
        'd.js': `define('d', ['foo'], function() { })`,
      });
    });

    it('extracts', function() {
      expect(depsFromFile(ROOT + 'es5/foo.js')).to.eql(['a', 'b/c']);
      expect(depsFromFile(ROOT + 'es5/a.js')).to.eql([]);
      expect(depsFromFile(ROOT + 'es5/b/c.js')).to.eql(['../a', '../d']);
      expect(depsFromFile(ROOT + 'es5/d.js')).to.eql(['foo']);
    });
  });

  describe('ES6', function() {
    beforeEach(function() {
      fs.removeSync(ROOT);
      fixturify.writeSync(ROOT + 'es6', {
        'foo.js': `
import x from 'a';
import y from 'b/c';`,
        'a.js': ``,
        b: {
          'c.js': `
      import a from '../a';
      import d from '../d';
    `,
        },
        'd.js': `import foo from 'foo';`,
      });
    });

    it('extracts', function() {
      expect(depsFromFile(ROOT + 'es6/foo.js')).to.eql(['a', 'b/c']);
      expect(depsFromFile(ROOT + 'es6/a.js')).to.eql([]);
      expect(depsFromFile(ROOT + 'es6/b/c.js')).to.eql(['../a', '../d']);
      expect(depsFromFile(ROOT + 'es6/d.js')).to.eql(['foo']);
    });
  });

  describe('pluggable parse', function() {
    fs.removeSync(ROOT);
    fixturify.writeSync(ROOT + 'es6', {
      'foo.js': `
import x from 'a';
import y from 'b/c';`,
      'a.js': ``,
      b: {
        'c.js': `
      import a from '../a';
      import d from '../d';
    `,
      },
      'd.js': `import foo from 'foo';`,
    });

    it('provide alternative parser', function() {
      let parseCount = 0;
      expect(
        depsFromFile(ROOT + 'es6/foo.js', {
          parse(source) {
            parseCount++;
            return defaultParser(source);
          },
        })
      ).to.eql(['a', 'b/c']);

      expect(parseCount).to.eql(1);
    });
  });
});
