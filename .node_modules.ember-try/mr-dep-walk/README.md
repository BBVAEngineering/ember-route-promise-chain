# mr-dep-walk

[![Build Status](https://travis-ci.org/stefanpenner/mr-dep-walk.svg?branch=master)](https://travis-ci.org/stefanpenner/mr-dep-walk)
[![Build status](https://ci.appveyor.com/api/projects/status/ybwgahl64faf0507?svg=true)](https://ci.appveyor.com/project/embercli/mr-dep-walk)

This library extracts dependent files from both ES6 module syntax, and AMD module syntax;

## Usage

```
yarn add mr-dep-walk
```

```js
const {
  depFilesFromFile,
  depsFromFile,
  depsFromSource,
  depsFromAST
} = require('mr-dep-walk');
```

For `depFilesFromFile` given an entry file, it will produce a list of all dependent files (recursively):
```js
// file.js
import x from 'y';

// y.js
```

```js
depFilesFromFile({
  entry: 'file.js',
  /* cwd: optional, */
  /* parse: optional,  */
}); // => 'y.js';
```

For `depsFromFile` given a file, it will produce a list of its immediate dependent moduleNames;

```js
// file.js
import x from 'y';

// y.js
```

```js
depsFromFile({
  entry: 'file.js',
  /* cwd: optional, */
  /* parse: optional,  */
}); // => 'y';
```

For `depsFromSource` given the raw source, it will produce a list of its immediate dependent moduleNames;

```js
depsFromSource(`import x from 'y'`/*, options */); // => 'y'
```

For `depsFromAST` given the AST, it will produce a list of its immediate dependent moduleNames;

```js
depsFromSource(acorn.parse(`import x from 'y'`, {
  ecmaVersion: 8,
  sourceType: 'module'
})); // => 'y'
```


### Custom Parse Step

By default mr-dep-walk will use:

```js
source => acorn.parse(source, { ecmaVersion: 8, sourceType: 'module'})
```

But some methods (`depFilesFromFile`, `depsFromFile`, `depsFromSource`) support
an alt-parser, example:

```js
depFilesFromFile('some-file.js', {
  entry: 'foo.js',
  parse(source) {
    return customParser(source);
  },
});
```
