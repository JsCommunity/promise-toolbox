const noop = require("./_noop");

// when the rejection is handled later
module.exports = function suppressUnhandledRejections(promise) {
  const native = promise.suppressUnhandledRejections;
  if (typeof native === "function") {
    native.call(promise);
  } else {
    promise.then(undefined, noop);
  }
  return promise;
};
