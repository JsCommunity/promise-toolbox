module.exports = function pFinally(promise, cb) {
  return promise.then(cb, cb).then(() => promise);
};
