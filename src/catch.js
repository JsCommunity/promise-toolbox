const matchError = require("./_matchError");

function handler(predicates, cb, reason) {
  return matchError(predicates, reason) ? cb(reason) : this;
}

// Similar to `Promise#catch()` but:
// - support predicates
// - do not catch `ReferenceError`, `SyntaxError` or `TypeError`
//   unless they match a predicate because they are usually programmer
//   errors and should be handled separately.
module.exports = function pCatch() {
  let n = arguments.length;

  let cb;
  if (n === 0 || typeof (cb = arguments[--n]) !== "function") {
    return this;
  }

  return this.then(
    undefined,
    handler.bind(
      this,
      n === 0
        ? undefined
        : n === 1
        ? arguments[0]
        : Array.prototype.slice.call(arguments, 0, n),
      cb
    )
  );
};
