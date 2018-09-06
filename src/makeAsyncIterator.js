const noop = require('./_noop')
const { makeAsyncIterator } = require('./_utils')

const makeAsyncIteratorWrapper = iterator => {
  const asyncIterator = makeAsyncIterator(iterator)

  return function asyncIteratorWrapper (iteratee) {
    return asyncIterator(this, iteratee).then(noop)
  }
}

module.exports = makeAsyncIteratorWrapper
