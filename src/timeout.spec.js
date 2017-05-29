/* eslint-env jest */

import { timeout, TimeoutError } from './'
import { reject, rejectionOf } from './fixtures'

describe('timeout()', () => {
  const neverSettle = new Promise(() => {})

  it('rejects a promise if not settled after a delay', async () => {
    expect(
      await rejectionOf(neverSettle::timeout(10))
    ).toBeInstanceOf(TimeoutError)
  })

  it('call the callback if not settled after a delay', async () => {
    expect(
      await neverSettle::timeout(10, () => 'bar')
    ).toBe('bar')
  })

  it('forwards the settlement if settled before a delay', async () => {
    expect(
      await Promise.resolve('value')::timeout(10)
    ).toBe('value')

    expect(
      await rejectionOf(reject('reason')::timeout(10))
    ).toBe('reason')
  })

  it('rejects if cb throws synchronously', async () => {
    expect(
      await rejectionOf(neverSettle::timeout(10, () => {
        throw 'reason' // eslint-disable-line no-throw-literal
      }))
    ).toBe('reason')
  })
})
