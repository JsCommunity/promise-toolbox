const { isArray, prototype: { slice } } = Array

module.exports = function pPipe (fns) {
  if (!isArray(fns)) {
    fns = slice.call(arguments)
  }

  return function (arg) {
    return fns.reduce(function (prev, fn) {
      return prev.then(fn)
    }, Promise.resolve(arg))
  }
}
