const TimeoutError = require('./TimeoutError')

// Usage:
// - promise::timeout(ms)
// - promise::timeout(ms, rejectionValue)
// - promise::timeout(ms, cb)
module.exports = function timeout (ms, onReject) {
  return new Promise((resolve, reject) => {
    let handle = setTimeout(() => {
      handle = undefined

      if (typeof this.cancel === 'function') {
        this.cancel()
      }

      if (typeof onReject === 'function') {
        try {
          resolve(onReject())
        } catch (error) {
          reject(error)
        }
      } else {
        reject(onReject !== undefined ? onReject : new TimeoutError())
      }
    }, ms)

    this.then(
      value => {
        handle !== undefined && clearTimeout(handle)
        resolve(value)
      },
      reason => {
        handle !== undefined && clearTimeout(handle)
        reject(reason)
      }
    )
  })
}
