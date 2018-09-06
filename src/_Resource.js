module.exports = function Resource (promise, disposer) {
  this.d = disposer
  this.p = promise
}
