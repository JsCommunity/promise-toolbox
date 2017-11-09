const isProgrammerError = require('./_isProgrammerError')

const matchError = (predicate, error) => {
  if (typeof predicate === 'function') {
    return predicate === Error || predicate.prototype instanceof Error
      ? error instanceof predicate
      : predicate(error)
  }

  if (error != null && typeof predicate === 'object') {
    for (const key in predicate) {
      if (
        hasOwnProperty.call(predicate, key) &&
        error[key] !== predicate[key]
      ) {
        return false
      }
    }
    return true
  }
}

// Similar to `Promise#catch()` but:
// - support predicates
// - do not catch `ReferenceError`, `SyntaxError` or `TypeError`
//   unless they match a predicate because they are usually programmer
//   errors and should be handled separately.
module.exports = function pCatch () {
  let n = arguments.length

  let cb
  if (n === 0 || typeof (cb = arguments[--n]) !== 'function') {
    return this
  }

  if (n === 0) {
    return this.then(
      undefined,
      reason => (isProgrammerError(reason) ? this : cb(reason))
    )
  }

  const predicates = new Array(n)
  for (let i = 0; i < n; ++i) {
    predicates[i] = arguments[i]
  }

  return this.then(undefined, reason => {
    for (let i = 0; i < n; ++i) {
      if (matchError(predicates[i], reason)) {
        return cb(reason)
      }
    }
    return this
  })
}
