const matchError = require("./_matchError");

function handler(predicates, cb, reason) {
  return matchError(predicates, reason) ? cb(reason) : this;
}

// Similar to `Promise#catch()` but:
// - support predicates
// - do not catch `ReferenceError`, `SyntaxError` or `TypeError`
//   unless they match a predicate because they are usually programmer
//   errors and should be handled separately.
module.exports = function pCatch(promise) {
  let n = arguments.length;

  let cb;
  if (n === 1 || typeof (cb = arguments[--n]) !== "function") {
    return promise;
  }

  return promise.then(
    undefined,
    handler.bind(
      promise,
      n === 1
        ? undefined
        : n === 2
        ? arguments[1]
        : Array.prototype.slice.call(arguments, 1, n),
      cb
    )
  );
};
