module.exports = function asCallback(promise, cb) {
  if (typeof cb === "function") {
    promise.then(value => cb(undefined, value), cb);
  }

  return promise;
};
