const setFunctionNameAndLength = require("./_setFunctionNameAndLength");

const { slice } = Array.prototype;

const nodeify = fn =>
  setFunctionNameAndLength(
    function() {
      const last = arguments.length - 1;
      let cb;
      if (last < 0 || typeof (cb = arguments[last]) !== "function") {
        throw new TypeError("missing callback");
      }
      const args = slice.call(arguments, 0, last);
      fn.apply(this, args).then(
        value => cb(undefined, value),
        cb
      );
    },
    fn.name,
    fn.length + 1
  );

module.exports = nodeify;
