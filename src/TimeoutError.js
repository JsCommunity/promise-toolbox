const { BaseError } = require('make-error')

module.exports = class TimeoutError extends BaseError {
  constructor () {
    super('operation timed out')
  }
}
