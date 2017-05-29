/* eslint-env jest */

import { tap } from './'
import { reject, rejectionOf } from './fixtures'

describe('tap(cb)', () => {
  it('call cb with the resolved value', () => new Promise(resolve => {
    Promise.resolve('value')::tap(value => {
      expect(value).toBe('value')
      resolve()
    })
  }))

  it('does not call cb if the promise is rejected', async () => {
    expect(
      await rejectionOf(reject('reason')::tap(() => reject('other reason')))
    ).toBe('reason')
  })

  it('forwards the resolved value', async () => {
    expect(
      await Promise.resolve('value')::tap(() => 'other value')
    ).toBe('value')
  })

  it('rejects if cb rejects', async () => {
    expect(
      await rejectionOf(Promise.resolve('value')::tap(() => reject('reason')))
    ).toBe('reason')
  })
})

describe('tap(null, cb)', () => {
  it('call cb with the rejected reason', () => new Promise(resolve => {
    reject('reason')::tap(null, reason => {
      expect(reason).toBe('reason')
      resolve()
    }).catch(() => {}) // prevents the unhandled rejection warning
  }))

  it('does not call cb if the promise is resolved', async () => {
    expect(
      await Promise.resolve('value')::tap(null, () => reject('other reason'))
    ).toBe('value')
  })

  it('forwards the rejected reason', async () => {
    expect(
      await rejectionOf(reject('reason')::tap(null, () => 'value'))
    ).toBe('reason')
  })

  it('rejects if cb rejects', async () => {
    expect(
      await rejectionOf(reject('reason')::tap(null, () => reject('other reason')))
    ).toBe('other reason')
  })
})
