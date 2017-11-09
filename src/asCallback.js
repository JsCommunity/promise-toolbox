// Usage: promise::asCallback(cb)
module.exports = function asCallback (cb) {
  if (typeof cb === 'function') {
    this.then(value => cb(undefined, value), cb)
  }

  return this
}
