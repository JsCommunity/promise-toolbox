const noop = require('./_noop')

// when the rejection is handled later
module.exports = function suppressUnhandledRejections () {
  const native = this.suppressUnhandledRejections
  if (typeof native === 'function') {
    native.call(this)
  } else {
    this.then(undefined, noop)
  }
  return this
}
