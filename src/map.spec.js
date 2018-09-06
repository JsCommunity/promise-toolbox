/* eslint-env jest */

const map = require('./map')

describe('map()', () => {
  it('works with array', async () => {
    expect(
      await Promise.resolve(['foo', Promise.resolve('bar')])::map(
        v => `${v} ${v}`
      )
    ).toEqual(['foo foo', 'bar bar'])
  })
})
