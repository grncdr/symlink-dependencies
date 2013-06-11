# symlink-dependencies

## Synopsis

```javascript
var symlinkDeps  = require('symlink-dependencies');
var cacheDir     = __dirname + '/npm-cache';
var moduleDir    = __dirname + '/node_modules';
var dependencies = {
  'a-neat-package': '1.2.5' // Must be an exact version
}

// callback is optional, this function also returns a promise.
symlinkDeps(cacheDir, moduleDir, dependencies, function (err) {
  // module dir has been created if necessary, and each dependency is linked
  // into place
})
```

## Description

This acts sort of like npm link, except it makes links from an npm cache
directory (with paths like `${name}/${version}/package`).

The stream mapper will blow up quite loudly if you try to use it on your normal
npm cache though because that might break npm itself.

## Stream API

You can also create a stream mapper that operates on a stream of dependency
objects (as created by
[create-dependency-stream](https://github.com/grncdr/create-dependency-stream)):

```javascript
var mapper = symlinkDependencies.streamMapper({cache: cacheDir})
createDependencyStream(...).pipe(mapper)
//=> stream of ready-to-use dependencies (as long as they are pure JS)
```

## License

MIT
