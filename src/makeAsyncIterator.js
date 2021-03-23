const noop = require("./_noop");
const { makeAsyncIterator } = require("./_utils");

const makeAsyncIteratorWrapper = iterator => {
  const asyncIterator = makeAsyncIterator(iterator);

  return function asyncIteratorWrapper(promise, iteratee) {
    return asyncIterator(promise, iteratee).then(noop);
  };
};

module.exports = makeAsyncIteratorWrapper;
