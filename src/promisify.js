const setFunctionNameAndLength = require('./_setFunctionNameAndLength')

// Usage: promisify(fn, [ context ])
const promisify = (fn, context) =>
  setFunctionNameAndLength(
    function () {
      const { length } = arguments
      const args = new Array(length + 1)
      for (let i = 0; i < length; ++i) {
        args[i] = arguments[i]
      }

      return new Promise((resolve, reject) => {
        args[length] = (error, result) =>
          error ? reject(error) : resolve(result)

        fn.apply(context === undefined ? this : context, args)
      })
    },
    fn.name,
    fn.length - 1
  )
module.exports = promisify
