//var crypto = require('crypto');
var fs   = require('fs');
var path = require('path');

var lockfile = require('lockfile');
var map      = require('map-stream');
var mkdirp   = require('mkdirp');
var Q        = require('q');

module.exports = symlinkDependencies;

function symlinkDependencies(cacheDir, moduleDir, deps, callback) {
  var depNames = Object.keys(deps || {});
  if (!depNames.length) return Q().nodeify(callback)

  return Q.nfcall(mkdirp, moduleDir).then(function () {
    return Q.all(depNames.map(function (name) {
      var dep  = deps[name];
      var source = path.join(cacheDir, dep.name, dep.version, 'package');
      var dest   = path.join(moduleDir, dep.name);
      return Q.nfcall(fs.symlink, source, dest).then(void(0), function (err) {
        if (err.code != 'EEXIST') throw err;
      });
    }));
  }).nodeify(callback);
}

// create a stream mapper function that will symlink dependencies in-place in
// opts.cacheDir for each dependency object.
symlinkDependencies.streamMapper = function (opts) {
  var cacheDir = opts.cache;
  if (!cacheDir) {
    throw new Error("opts.cache is required");
  }

  if (cacheDir == path.join(process.env.HOME, '.npm')) {
    throw new Error("refusing to mess up the default cache directory");
  }

  return map(function (dep, callback) {
    var installDir = path.join(cacheDir, dep.name, dep.version);
    var lock       = path.join(installDir, 'symlinking.lock');
    var doneMarker = path.join(installDir, 'link-deps.finished');
    var moduleDir  = path.join(installDir, 'package', 'node_modules');

    return exists(doneMarker)
      .then(function (finished) { return finished || doSymlink() })
      .then(function () { return dep; })
      .nodeify(callback);

    function doSymlink() {
      return Q.nfcall(lockfile.lock, lock).then(function () {
        return symlinkDependencies(cacheDir, moduleDir, dep.dependencies)
          .then(writeDoneMarker)
          .then(releaseLock);
      }, function (err) {
        // failed to acquire lock
        console.error(err.stack);
      })

      function releaseLock() {
        return Q.nfcall(lockfile.unlock, lock);
      }

      function writeDoneMarker() {
        return Q.nfcall(fs.writeFile, doneMarker, '')
      }
    }
  })
}

// Q.fbind and fs.exists don't get along
function exists(pathname) {
  var deferred = Q.defer();
  fs.exists(pathname, function (exists) {
    deferred.resolve(exists);
  })
  return deferred.promise;
}
