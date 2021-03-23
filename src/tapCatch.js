module.exports = function tapCatch(promise, cb) {
  return promise.then(undefined, cb).then(() => promise);
};
