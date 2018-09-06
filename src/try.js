const resolve = require('./_resolve')

module.exports = fn => {
  try {
    return resolve(fn())
  } catch (error) {
    return Promise.reject(error)
  }
}
