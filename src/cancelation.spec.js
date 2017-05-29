/* eslint-env jest */

import { Cancel, cancelable, CancelToken } from './'
import { noop } from './fixtures'

describe('@cancelable', () => {
  it('forwards params if a cancel token is passed', () => {
    const token = new CancelToken(noop)
    const spy = jest.fn(() => Promise.resolve())

    cancelable(spy)(token, 'foo', 'bar')
    expect(spy.mock.calls).toEqual([
      [ token, 'foo', 'bar' ]
    ])
  })

  it('injects a cancel token and add the cancel method on the returned promise if none is passed', () => {
    const spy = jest.fn(() => Promise.resolve())

    const promise = cancelable(spy)('foo', 'bar')
    expect(spy.mock.calls).toEqual([
      [ {
        asymmetricMatch: actual => CancelToken.isCancelToken(actual)
      }, 'foo', 'bar' ]
    ])
    const token = spy.mock.calls[0][0]
    expect(token.requested).toBe(false)
    promise.cancel()
    expect(token.requested).toBe(true)
  })
})

// -------------------------------------------------------------------

describe('CancelToken', () => {
  describe('.isCancelToken()', () => {
    it('determines whether the passed value is a CancelToken', () => {
      expect(CancelToken.isCancelToken(null)).toBe(false)
      expect(CancelToken.isCancelToken({})).toBe(false)
      expect(CancelToken.isCancelToken(new CancelToken(noop))).toBe(true)
    })
  })

  describe('.race', () => {
    it('returns a token which resolve synchronously', () => {
      const { cancel, token } = CancelToken.source()

      const raceToken = CancelToken.race([
        new CancelToken(noop),
        token
      ])

      expect(raceToken.reason).toBeUndefined()
      cancel()
      expect(raceToken.reason).toBe(token.reason)
    })
  })

  describe('.source()', () => {
    it('creates a new token', () => {
      const { cancel, token } = CancelToken.source()

      expect(token.requested).toBe(false)
      cancel()
      expect(token.requested).toBe(true)
    })
  })

  describe('#promise', () => {
    it('returns a promise resolving on cancel', async () => {
      const { cancel, token } = CancelToken.source()

      const { promise } = token
      cancel('foo')

      const value = await promise
      expect(value).toBeInstanceOf(Cancel)
      expect(value.message).toBe('foo')
    })
  })

  describe('#reason', () => {
    it('synchronously returns the cancelation reason', () => {
      const { cancel, token } = CancelToken.source()

      expect(token.reason).toBeUndefined()
      cancel('foo')
      expect(token.reason.message).toBe('foo')
    })
  })

  describe('#requested', () => {
    it('synchronously returns whether cancelation has been requested', () => {
      const { cancel, token } = CancelToken.source()

      expect(token.requested).toBe(false)
      cancel()
      expect(token.requested).toBe(true)
    })
  })

  describe('#fork()', () => {
    it('creates a token which resolves when the current one does', () => {
      const { cancel, token } = CancelToken.source()
      const fork = token.fork(noop)

      expect(fork.requested).toBe(false)
      cancel()
      expect(fork.requested).toBe(true)
    })

    it('creates a token which resolves when the executor calls its param', () => {
      const token = new CancelToken(noop)
      let cancel
      const fork = token.fork(c => {
        cancel = c
      })

      expect(fork.requested).toBe(false)
      cancel()
      expect(fork.requested).toBe(true)
    })

    it('returns an object containing the token and a cancel function if no executor is provided', () => {
      const token = new CancelToken(noop)
      const { cancel, token: fork } = token.fork()

      expect(fork.requested).toBe(false)
      cancel()
      expect(fork.requested).toBe(true)
    })
  })

  describe('#throwIfRequested()', () => {
    it('synchronously throws if cancelation has been requested', () => {
      const { cancel, token } = CancelToken.source()

      token.throwIfRequested()
      cancel('foo')
      try {
        token.throwIfRequested()
        expect(false).toBe('should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(Cancel)
        expect(error.message).toBe('foo')
      }
    })
  })
})
