/* eslint-env jest */

import makeError from 'make-error'

import {
  all,
  attempt,
  Cancel,
  cancellable,
  CancelToken,
  catchPlus,
  disposer,
  forArray,
  fromCallback,
  join,
  lastly,
  promisifyAll,
  settle,
  tap,
  timeout,
  TimeoutError,
  unpromisify,
  using
} from './'

// ===================================================================

const hideLiteralErrorFromLinter = literal => literal
const identity = value => value
const noop = () => {}
const throwArg = value => { throw value }

// swap resolution/rejection of a promise to help test rejection
const rejectionOf = promise => promise.then(throwArg, identity)

// ===================================================================

// work around prefer-promise-reject-errors
const reject = value => Promise.reject(value)

describe('all()', () => {
  it('with array', async () => {
    expect(await [
      Promise.resolve('foo'),
      'bar'
    ]::all()).toEqual([
      'foo',
      'bar'
    ])
  })

  it('with object', async () => {
    expect(await {
      foo: Promise.resolve('foo'),
      bar: 'bar'
    }::all()).toEqual({
      foo: 'foo',
      bar: 'bar'
    })
  })

  it('resolve with empty collection', async () => {
    expect(await []::all()).toEqual([])
  })

  it('rejects first rejection', async () => {
    expect(await rejectionOf([
      'foo',
      reject('bar')
    ]::all())).toBe('bar')
  })

  it('rejects first rejection (even with pending promises)', async () => {
    expect(await rejectionOf([
      new Promise(() => {}),
      reject('bar')
    ]::all())).toBe('bar')
  })
})

// -------------------------------------------------------------------

describe('@cancellable', () => {
  it('forwards params if a cancel token is passed', () => {
    const token = new CancelToken(noop)
    const spy = jest.fn(() => Promise.resolve())

    cancellable(spy)(token, 'foo', 'bar')
    expect(spy.mock.calls).toEqual([
      [ token, 'foo', 'bar' ]
    ])
  })

  it('injects a cancel token and add the cancel method on the returned promise if none is passed', () => {
    const spy = jest.fn(() => Promise.resolve())

    const promise = cancellable(spy)('foo', 'bar')
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

  describe('#race', () => {
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

  describe('#reason', () => {
    it('synchronously returns the cancellation reason', () => {
      const { cancel, token } = CancelToken.source()

      expect(token.reason).toBeUndefined()
      cancel('foo')
      expect(token.reason.message).toBe('foo')
    })
  })

  describe('#requested', () => {
    it('synchronously returns whether cancellation has been requested', () => {
      const { cancel, token } = CancelToken.source()

      expect(token.requested).toBe(false)
      cancel()
      expect(token.requested).toBe(true)
    })
  })

  describe('#throwIfRequested', () => {
    it('synchronously throws if cancellation has been requested', () => {
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

// -------------------------------------------------------------------

describe('catchPlus', () => {
  it('catches errors matching a predicate', async () => {
    const predicate = reason => reason === 'foo'

    expect(
      await reject('foo')::catchPlus(predicate, identity)
    ).toBe('foo')

    expect(
      await rejectionOf(reject('bar')::catchPlus(predicate, identity))
    ).toBe('bar')
  })

  it('catches errors matching a class', async () => {
    const CustomError1 = makeError('CustomError1')
    const CustomError2 = makeError('CustomError2')

    const error = new CustomError1()

    // The class itself.
    expect(
      await Promise.reject(error)::catchPlus(CustomError1, identity)
    ).toBe(error)

    // A parent.
    expect(
      await Promise.reject(error)::catchPlus(Error, identity)
    ).toBe(error)

    // Another class.
    expect(
      await rejectionOf(Promise.reject(error)::catchPlus(CustomError2, identity))
    ).toBe(error)
  })

  it('catches errors matching an object pattern', async () => {
    const predicate = { foo: 0 }

    expect(
      typeof await reject({ foo: 0 })::catchPlus(predicate, identity)
    ).toBe('object')

    expect(
      typeof await rejectionOf(reject({ foo: 1 })::catchPlus(predicate, identity))
    ).toBe('object')

    expect(
      typeof await rejectionOf(reject({ bar: 0 })::catchPlus(predicate, identity))
    ).toBe('object')
  })

  it('does not catch programmer errors', async () => {
    expect(
      await rejectionOf(Promise.reject(new TypeError(''))::catchPlus(identity))
    ).toBeInstanceOf(TypeError)
    expect(
      await rejectionOf(Promise.reject(new SyntaxError(''))::catchPlus(identity))
    ).toBeInstanceOf(SyntaxError)

    // Unless matches by a predicate.
    expect(
      await Promise.reject(new TypeError(''))::catchPlus(TypeError, identity)
    ).toBeInstanceOf(TypeError)
  })
})

// -------------------------------------------------------------------

describe('disposer()', () => {
  it('called with flat params', async () => {
    const d1 = jest.fn()
    const p1 = Promise.resolve('p1')::disposer(d1)
    const p2 = Promise.resolve('p2')
    const handler = jest.fn(() => 'handler')

    expect(await using(p1, p2, handler)).toBe('handler')
    expect(handler.mock.calls).toEqual([ [ 'p1', 'p2' ] ])
    expect(d1.mock.calls).toEqual([ [ 'p1' ] ])
  })

  it('called with array param', async () => {
    const d1 = jest.fn()
    const p1 = Promise.resolve('p1')::disposer(d1)
    const p2 = Promise.resolve('p2')
    const handler = jest.fn(() => 'handler')

    expect(await using([ p1, p2 ], handler)).toBe('handler')
    expect(handler.mock.calls).toEqual([ [ [ 'p1', 'p2' ] ] ])
    expect(d1.mock.calls).toEqual([ [ 'p1' ] ])
  })

  it('a resource can only be used once', async () => {
    const d1 = jest.fn()
    const p1 = Promise.resolve('p1')::disposer(d1)
    const handler = jest.fn()

    await using(p1, handler)
    handler.mockClear()
    d1.mockClear()

    const d2 = jest.fn()
    const p2 = Promise.resolve('p2')::disposer(d2)

    expect(await rejectionOf(using(p1, p2, noop))).toBeInstanceOf(TypeError)
    expect(handler).not.toHaveBeenCalled()
    expect(d1).not.toHaveBeenCalled()
    expect(d2).toHaveBeenCalledTimes(1)
  })

  it('error in a provider', async () => {
    const d1 = jest.fn()
    const p1 = Promise.resolve('p1')::disposer(d1)
    const d2 = jest.fn()
    const p2 = Promise.reject(hideLiteralErrorFromLinter('p2'))::disposer(d2)
    const p3 = Promise.resolve('p3')
    const handler = jest.fn()

    expect(await rejectionOf(using(p1, p2, p3, handler))).toBe('p2')
    expect(handler).not.toHaveBeenCalled()
    expect(d1.mock.calls).toEqual([ [ 'p1' ] ])
    expect(d2).not.toHaveBeenCalled()
  })

  it('error in handler', async () => {
    const d1 = jest.fn()
    const p1 = Promise.resolve('p1')::disposer(d1)
    const d2 = jest.fn()
    const p2 = Promise.resolve('p2')::disposer(d2)
    const p3 = Promise.resolve('p3')
    const handler = jest.fn(() => Promise.reject(hideLiteralErrorFromLinter('handler')))

    expect(await rejectionOf(using(p1, p2, p3, handler))).toBe('handler')
    expect(handler.mock.calls).toEqual([ [ 'p1', 'p2', 'p3' ] ])
    expect(d1.mock.calls).toEqual([ [ 'p1' ] ])
    expect(d2.mock.calls).toEqual([ [ 'p2' ] ])
  })

  it('error in a disposer')
})

// -------------------------------------------------------------------

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

// -------------------------------------------------------------------

describe('fromCallback()', () => {
  it('creates a promise which resolves with value passed to the callback', async () => {
    expect(await fromCallback(cb => cb(null, 'foo'))).toBe('foo')
  })

  it('creates a promise which rejects with reason passed to the callback', async () => {
    expect(await rejectionOf(fromCallback(cb => cb(hideLiteralErrorFromLinter('bar'))))).toBe('bar')
  })
})

// -------------------------------------------------------------------

describe('join()', () => {
  it('calls the callback once promises are resolved', () => join(
    Promise.resolve('foo'), Promise.resolve('bar'),
    (foo, bar) => {
      expect(foo).toBe('foo')
      expect(bar).toBe('bar')
    }
  ))

  it('can takes inputs in an array', () => join(
    [ Promise.resolve('foo'), Promise.resolve('bar') ],
    (foo, bar) => {
      expect(foo).toBe('foo')
      expect(bar).toBe('bar')
    }
  ))

  it('rejects if one promise rejects', async () => {
    expect(await rejectionOf(join(
      Promise.resolve('foo'), reject('bar'),
      (foo, bar) => {
        expect(foo).toBe('foo')
        expect(bar).toBe('bar')
      }
    ))).toBe('bar')
  })
})

// -------------------------------------------------------------------

describe('lastly()', () => {
  it('calls a callback on resolution', async () => {
    const value = {}
    const spy = jest.fn()

    expect(
      await Promise.resolve(value)::lastly(spy)
    ).toBe(
      value
    )

    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('calls a callback on rejection', async () => {
    const reason = {}
    const spy = jest.fn()

    expect(
      await rejectionOf(Promise.reject(reason)::lastly(spy))
    ).toBe(
      reason
    )

    expect(spy).toHaveBeenCalledTimes(1)
  })
})

// -------------------------------------------------------------------

describe('promisifyAll()', () => {
  it('returns a new object', () => {
    const o = {}
    const r = promisifyAll(o)

    expect(typeof r).toBe('object')
    expect(r).not.toBe(o)
  })

  it('creates promisified version of all functions bound to the original object', async () => {
    const o = {
      foo (cb) {
        cb(null, this)
      }
    }
    const r = promisifyAll(o)

    expect(await r.foo()).toBe(o)
  })

  it('ignores functions ending with Sync or Async', () => {
    const o = {
      fooAsync () {},
      fooSync () {}
    }
    const r = o::promisifyAll()

    expect(r.foo).not.toBeDefined()
    expect(r.fooASync).not.toBeDefined()
    expect(r.fooSync).not.toBeDefined()
  })
})

// -------------------------------------------------------------------

describe('settle()', () => {
  it('works with arrays', () => {
    return [
      Promise.resolve(42),
      Math.PI,
      reject('fatality')
    ]::settle().then(([ status1, status2, status3 ]) => {
      expect(status1.isFulfilled()).toBe(true)
      expect(status2.isFulfilled()).toBe(true)
      expect(status3.isFulfilled()).toBe(false)

      // Alias.
      expect(status1.isResolved()).toBe(true)
      expect(status2.isResolved()).toBe(true)
      expect(status3.isResolved()).toBe(false)

      expect(status1.isRejected()).toBe(false)
      expect(status2.isRejected()).toBe(false)
      expect(status3.isRejected()).toBe(true)

      expect(status1.value()).toBe(42)
      expect(status2.value()).toBe(Math.PI)
      expect(::status3.value).toThrow()

      expect(::status1.reason).toThrow()
      expect(::status2.reason).toThrow()
      expect(status3.reason()).toBe('fatality')
    })
  })

  it('works with objects', () => {
    return {
      a: Promise.resolve(42),
      b: Math.PI,
      c: reject('fatality')
    }::settle().then(({
      a: status1,
      b: status2,
      c: status3
    }) => {
      expect(status1.isFulfilled()).toBe(true)
      expect(status2.isFulfilled()).toBe(true)
      expect(status3.isFulfilled()).toBe(false)

      // Alias.
      expect(status1.isResolved()).toBe(true)
      expect(status2.isResolved()).toBe(true)
      expect(status3.isResolved()).toBe(false)

      expect(status1.isRejected()).toBe(false)
      expect(status2.isRejected()).toBe(false)
      expect(status3.isRejected()).toBe(true)

      expect(status1.value()).toBe(42)
      expect(status2.value()).toBe(Math.PI)
      expect(::status3.value).toThrow()

      expect(::status1.reason).toThrow()
      expect(::status2.reason).toThrow()
      expect(status3.reason()).toBe('fatality')
    })
  })
})

// -------------------------------------------------------------------

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

// -------------------------------------------------------------------

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

// -------------------------------------------------------------------

describe('try() / attempt()', () => {
  it('wraps returned value in promise', () => {
    return attempt(() => 'foo').then(value => {
      expect(value).toBe('foo')
    })
  })

  it('wraps thrown exception in promise', () => {
    return rejectionOf(attempt(() => throwArg('foo'))).then(exception => {
      expect(exception).toBe('foo')
    })
  })

  it('calls the callback synchronously', () => {
    const spy = jest.fn()
    attempt(spy)

    expect(spy).toHaveBeenCalled()
  })
})

// -------------------------------------------------------------------

describe('unpromisify()', () => {
  it('forwards the result', done => {
    const fn = unpromisify.call(() => Promise.resolve('foo'))

    fn((error, result) => {
      expect(error).toBe(null)
      expect(result).toBe('foo')

      done()
    })
  })

  it('forwards the error', done => {
    const fn = unpromisify.call(() => reject('foo'))

    fn(error => {
      expect(error).toBe('foo')

      done()
    })
  })
})
