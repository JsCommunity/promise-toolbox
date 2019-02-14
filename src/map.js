const defer = require("./defer");
const identity = require("./_identity");
const isPromise = require("./isPromise");
const { applyThen, forEach } = require("./_utils");

const map = (collection, iteratee = identity) => {
  if (isPromise(collection)) {
    return collection.then(collection => map(collection, iteratee));
  }

  let count = 1;
  let errorContainer;
  const result = [];
  const { promise, reject, resolve } = defer();

  const onFulfillment = () => {
    if (--count === 0) {
      if (errorContainer !== undefined) {
        reject(errorContainer.error);
      } else {
        resolve(result);
      }
    }
  };
  const onError = error => {
    if (errorContainer === undefined) {
      errorContainer = { error };
    }
    onFulfillment();
  };

  const mapItem = args => {
    const item = args[0];
    if (isPromise(item)) {
      return item.then(item => {
        args[0] = item;
        return mapItem(args);
      });
    }

    applyThen(
      iteratee,
      args,
      value => {
        result[args[3]] = value;
        onFulfillment();
      },
      onError
    );
  };

  let i = 0;
  forEach(collection, (item, key, collection) => {
    ++count;
    mapItem([item, key, collection, i++]);
  });

  onFulfillment();
  return promise;
};
module.exports = function(iteratee) {
  return map(this, iteratee);
};
