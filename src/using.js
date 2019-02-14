const once = require("./_once");
const Resource = require("./_Resource");
const wrapApply = require("./wrapApply");
const wrapCall = require("./wrapCall");
const { forArray, isArray } = require("./_utils");

// Usage: using(disposers…, handler)
module.exports = function using() {
  let nResources = arguments.length - 1;

  if (nResources < 1) {
    throw new TypeError("using expects at least 2 arguments");
  }

  const handler = arguments[nResources];

  let resources;
  const spread = nResources > 1 || !isArray((resources = arguments[0]));
  if (spread) {
    resources = Array.prototype.slice.call(arguments, 0, nResources);
  } else {
    nResources = resources.length;
  }

  const dispose = once((fn, value) => {
    let leftToProcess = nResources;

    const onSettle = () => {
      if (--leftToProcess === 0) {
        fn(value);
      }
    };

    // like Bluebird, on failure to dispose a resource, throw an async error
    const onFailure = reason => {
      setTimeout(() => {
        throw reason;
      }, 0);
    };

    forArray(resources, resource => {
      let d;
      if (resource != null && typeof (d = resource.d) === "function") {
        resource.p.then(
          value => wrapCall(d, value).then(onSettle, onFailure),
          onSettle
        );

        resource.p = resource.d = undefined;
      } else {
        --leftToProcess;
      }
    });
  });

  return new Promise((resolve, reject) => {
    const values = new Array(nResources);
    let leftToProcess = nResources;

    let onProviderFailure_ = reason => {
      onProviderFailure_ = onProviderSettle;
      onSettle = () => dispose(reject, reason);

      onProviderSettle();
    };
    const onProviderFailure = reason => onProviderFailure_(reason);

    const onProviderSettle = () => {
      if (--leftToProcess === 0) {
        onSettle();
      }
    };

    let onSettle = () =>
      (spread ? wrapApply : wrapCall)(handler, values, this).then(
        value => dispose(resolve, value),
        reason => dispose(reject, reason)
      );

    forArray(resources, (resource, i) => {
      let p;
      if (resource instanceof Resource) {
        ({ p } = resource);
        if (p === undefined) {
          return onProviderFailure(
            new TypeError("resource has already been disposed of")
          );
        }
      } else {
        p = Promise.resolve(resource);
      }

      p.then(value => {
        values[i] = value;

        onProviderSettle();
      }, onProviderFailure);
    });
  });
};
