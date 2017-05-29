/* eslint-env jest */

import { finally as finally_, lastly } from './'
import { rejectionOf } from './fixtures'

describe('finally()', () => {
  it('calls a callback on resolution', async () => {
    const value = {}
    const spy = jest.fn()

    expect(
      await Promise.resolve(value)::finally_(spy)
    ).toBe(
      value
    )

    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('calls a callback on rejection', async () => {
    const reason = {}
    const spy = jest.fn()

    expect(
      await rejectionOf(Promise.reject(reason)::finally_(spy))
    ).toBe(
      reason
    )

    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('is aliased as lastly()', () => {
    expect(lastly).toBe(finally_)
  })
})
