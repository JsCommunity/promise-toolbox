module.exports = function tap(promise, onFulfilled, onRejected) {
  return promise.then(onFulfilled, onRejected).then(() => promise);
};
