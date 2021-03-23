const isProgrammerError = require("./_isProgrammerError");

const cb = error => {
  if (isProgrammerError(error)) {
    throw error;
  }
};

module.exports = function ignoreErrors(promise) {
  return promise.then(undefined, cb);
};
