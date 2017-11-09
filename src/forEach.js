const makeAsyncIterator = require('./makeAsyncIterator')
const { forEach } = require('./_utils')

module.exports = makeAsyncIterator(forEach)
