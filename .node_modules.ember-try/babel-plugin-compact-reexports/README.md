# babel-plugin-compact-reexports

[![Build Status](https://travis-ci.org/ember-engines/babel-plugin-compact-reexports.svg?branch=master)](https://travis-ci.org/ember-engines/babel-plugin-compact-reexports)
[![Coverage Status](https://coveralls.io/repos/github/ember-engines/babel-plugin-compact-reexports/badge.svg)](https://coveralls.io/github/ember-engines/babel-plugin-compact-reexports)

Allows ES modules which just re-export contents of other modules to be more compact; saving you bytes over the wire.

This plugin is designed to work with [loader.js](https://github.com/ember-cli/loader.js), but could work with any AMD loader that supports a similar [`alias` API](https://github.com/ember-cli/loader.js/blob/5d95319c2ce779dd80ed3f57748da0eb0883ced6/lib/loader/loader.js#L255-L261).

_Original discussion: [ember-engines/ember-engines#265](https://github.com/ember-engines/ember-engines/issues/265)_

## What It Does

Given a re-export module:

```js
// my-module.js
export { default } from 'their-module';
```

When using AMD, this would normally compile to something like:

```js
define('my-module', ['exports', 'their-module'], function (exports, _theirModule) {
  'use strict';

  Object.defineProperty(exports, 'default', {
    enumerable: true,
    get: function get() {
      return _theirModule['default'];
    }
  });
});
```

Which is pretty verbose for a simple re-export. This plugin will rewrite the above to the following:

```js
define.alias('their-module', 'my-module');
```
