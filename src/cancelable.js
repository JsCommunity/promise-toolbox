const { isCancelToken, source } = require('./CancelToken')

// Usage:
//
//     @cancelable
//     async fn (cancelToken, other, args) {
//       if (!cancelToken.requested) {
//         doStuff()
//       }
//
//       cancelToken.throwIfRequested()
//
//       doSomeMoreStuff()
//
//       cancelToken.promise.then(() => {
//         // Do stuff if canceled.
//       })
//
//       // do other stuff.
//     }
const cancelable = (target, name, descriptor) => {
  const fn = descriptor !== undefined ? descriptor.value : target

  function cancelableWrapper () {
    const { length } = arguments
    if (length !== 0 && isCancelToken(arguments[0])) {
      return fn.apply(this, arguments)
    }

    const { cancel, token } = source()
    const args = new Array(length + 1)
    args[0] = token
    for (let i = 0; i < length; ++i) {
      args[i + 1] = arguments[i]
    }

    const promise = fn.apply(this, args)
    promise.cancel = cancel

    return promise
  }

  if (descriptor !== undefined) {
    descriptor.value = cancelableWrapper
    return descriptor
  }

  return cancelableWrapper
}
module.exports = cancelable
