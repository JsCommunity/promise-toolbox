// Ponyfill for Promise.finally(cb)
//
// Usage: promise::finally(cb)
module.exports = function pFinally(cb) {
  return this.then(cb, cb).then(() => this);
};
