/* eslint-env jest */

import { forArray } from './'

describe('forArray()', () => {
  it('iterates over an array of promises', async () => {
    const spy = jest.fn()

    const array = [
      Promise.resolve('foo'),
      Promise.resolve('bar'),
      'baz'
    ]

    expect(await array::forArray(spy)).not.toBeDefined()
    expect(await spy.mock.calls).toEqual([
      [ 'foo', 0, array ],
      [ 'bar', 1, array ],
      [ 'baz', 2, array ]
    ])
  })
})
