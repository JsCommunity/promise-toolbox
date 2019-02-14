const isPromise = require("./isPromise");

// Usage: promise::delay(ms, [value])
module.exports = function delay(ms) {
  const value = arguments.length === 2 ? arguments[1] : this;

  return isPromise(value)
    ? value.then(
        value =>
          new Promise(resolve => {
            setTimeout(resolve, ms, value);
          })
      )
    : new Promise(resolve => {
        setTimeout(resolve, ms, value);
      });
};
