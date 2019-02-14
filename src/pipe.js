const {
  isArray,
  prototype: { slice },
} = Array;

const chain = (promise, fn) => promise.then(fn);

module.exports = function pPipe(fns) {
  if (!isArray(fns)) {
    fns = slice.call(arguments);
  }

  return arg => fns.reduce(chain, Promise.resolve(arg));
};
