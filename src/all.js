const isPromise = require("./isPromise");
const { forEach, mapAuto } = require("./_utils");

const _all = (promises, mapFn) =>
  new Promise((resolve, reject) => {
    // mapFn may be undefined but it's okay :)
    let result = mapAuto(promises, mapFn);

    let count = 1;
    const onFulfillment0 = () => {
      if (--count === 0) {
        const tmp = result;
        result = undefined;
        resolve(tmp);
      }
    };

    const onFulfillment = (value, key) => {
      if (!result) {
        return;
      }

      result[key] = value;
      onFulfillment0();
    };

    const onRejection = reason => {
      if (!result) {
        return;
      }

      result = undefined;
      reject(reason);
    };

    forEach(mapFn !== undefined ? result : promises, (promise, key) => {
      ++count;

      if (isPromise(promise)) {
        promise.then(value => onFulfillment(value, key), onRejection);
      } else {
        onFulfillment(promise, key);
      }
    });
    onFulfillment0();
  });

// Returns a promise which resolves when all the promises in a
// collection have resolved or rejects with the reason of the first
// promise that rejects.
//
// Optionally a function can be provided to map all items in the
// collection before waiting for completion.
//
// Usage: promises::all([ mapFn ])
module.exports = function all(mapFn) {
  return isPromise(this)
    ? this.then(collection => _all(collection, mapFn))
    : _all(this, mapFn);
};
