const Resource = require('./_Resource')

// Usage: promise::disposer(disposer)
module.exports = function disposer (disposer) {
  return new Resource(this, disposer)
}
