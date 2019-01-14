'use strict';

const fixturify = require('fixturify');
const fs = require('fs-extra');
const ROOT = __dirname + '/fixtures/';

const expect = require('chai').expect;
const depFilesFromFile = require('../lib/dep-files-from-file');
const defaultParser = require('../lib/default-parser');

describe('.depFilesFromFile', function() {
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
      expect(depFilesFromFile(ROOT + 'es5', { entry: 'foo.js' })).to.eql([
        'a.js',
        'b/c.js',
        'd.js',
        'foo.js',
      ]);

      expect(depFilesFromFile(ROOT + 'es5', { entry: 'a.js' })).to.eql([]);

      expect(depFilesFromFile(ROOT + 'es5', { entry: 'b/c.js' })).to.eql([
        'a.js',
        'd.js',
        'foo.js',
        'b/c.js',
      ]);

      expect(depFilesFromFile(ROOT + 'es5', { entry: 'd.js' })).to.eql([
        'foo.js',
        'a.js',
        'b/c.js',
        'd.js',
      ]);
    });

    it('ignores external', function() {
      expect(
        depFilesFromFile(ROOT + 'es5', {
          entry: 'foo.js',
          external: ['b/c'],
        })
      ).to.eql(['a.js']);
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
      expect(depFilesFromFile(ROOT + 'es6', { entry: 'foo.js' })).to.eql([
        'a.js',
        'b/c.js',
        'd.js',
        'foo.js',
      ]);

      expect(depFilesFromFile(ROOT + 'es6', { entry: 'a.js' })).to.eql([]);

      expect(depFilesFromFile(ROOT + 'es6', { entry: 'b/c.js' })).to.eql([
        'a.js',
        'd.js',
        'foo.js',
        'b/c.js',
      ]);

      expect(depFilesFromFile(ROOT + 'es6', { entry: 'd.js' })).to.eql([
        'foo.js',
        'a.js',
        'b/c.js',
        'd.js',
      ]);
    });
  });

  describe('missing', function() {
    beforeEach(function() {
      fs.removeSync(ROOT);
      fixturify.writeSync(ROOT + 'es6', {
        'foo.js': `
import x from 'a';
import y from 'b/c';`,
      });
    });

    it('extracts', function() {
      expect(depFilesFromFile(ROOT + 'es6', { entry: 'foo.js' })).to.eql([
        'a.js',
        'b/c.js',
      ]);
    });
  });

  describe('cwd', function() {
    beforeEach(function() {
      fs.removeSync(ROOT);
      fixturify.writeSync(ROOT + 'cwd/foo', {
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
      expect(
        depFilesFromFile(ROOT + 'cwd', { entry: 'foo.js', cwd: 'foo' })
      ).to.eql(['foo/a.js', 'foo/b/c.js', 'foo/d.js', 'foo/foo.js']);

      expect(
        depFilesFromFile(ROOT + 'cwd', { entry: 'a.js', cwd: 'foo' })
      ).to.eql([]);

      expect(
        depFilesFromFile(ROOT + 'cwd', { entry: 'b/c.js', cwd: 'foo' })
      ).to.eql(['foo/a.js', 'foo/d.js', 'foo/foo.js', 'foo/b/c.js']);

      expect(
        depFilesFromFile(ROOT + 'cwd', { entry: 'd.js', cwd: 'foo' })
      ).to.eql(['foo/foo.js', 'foo/a.js', 'foo/b/c.js', 'foo/d.js']);
    });
  });

  describe('pluggable parser', function() {
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

    it('ensures the new parser is used', function() {
      let parseCalled = 0;
      expect(
        depFilesFromFile(ROOT + 'es5', {
          entry: 'foo.js',
          parse(source) {
            parseCalled++;
            return defaultParser(source);
          },
        })
      ).to.eql(['a.js', 'b/c.js', 'd.js', 'foo.js']);

      expect(parseCalled).to.eql(5);
    });
  });
});
