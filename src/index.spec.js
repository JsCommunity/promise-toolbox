/* eslint-env mocha */

import expect from 'must'
import makeError from 'make-error'
import sinon from 'sinon'

import {
  all,
  catchPlus,
  forArray,
  fromCallback,
  join,
  lastly,
  promisifyAll,
  settle,
  tap,
  timeout,
  TimeoutError,
  unpromisify
} from './'

// ===================================================================

describe('all()', () => {
  it('with array', () => expect([
    Promise.resolve('foo'),
    'bar'
  ]::all()).to.resolve.to.eql([
    'foo',
    'bar'
  ]))

  it('with object', () => expect({
    foo: Promise.resolve('foo'),
    bar: 'bar'
  }::all()).to.resolve.to.eql({
    foo: 'foo',
    bar: 'bar'
  }))

  it('resolve with empty collection', () => expect([]::all()).to.resolve.to.eql([]))

  it('rejects first rejection', () => expect([
    'foo',
    Promise.reject('bar')
  ]::all()).to.reject.to.equal('bar'))

  it('rejects first rejection (even with pending promises)', () => expect([
    new Promise(() => {}),
    Promise.reject('bar')
  ]::all()).to.reject.to.equal('bar'))
})

// -------------------------------------------------------------------

describe('catchPlus', () => {
  const ident = value => value

  it('catches errors matching a predicate', () => {
    const predicate = reason => reason === 'foo'

    return Promise.all([
      expect(
        Promise.reject('foo')::catchPlus(predicate, ident)
      ).to.resolve.to.equal('foo'),
      expect(
        Promise.reject('bar')::catchPlus(predicate, ident)
      ).to.reject.to.equal('bar')
    ])
  })

  it('catches errors matching a class', () => {
    const CustomError1 = makeError('CustomError1')
    const CustomError2 = makeError('CustomError2')

    const error = new CustomError1()

    return Promise.all([
      // The class itself.
      expect(
        Promise.reject(error)::catchPlus(CustomError1, ident)
      ).to.resolve.to.equal(error),

      // A parent.
      expect(
        Promise.reject(error)::catchPlus(Error, ident)
      ).to.resolve.to.equal(error),

      // Another class.
      expect(
        Promise.reject(error)::catchPlus(CustomError2, ident)
      ).to.reject.to.equal(error)
    ])
  })

  it('catches errors matching an object pattern', () => {
    const predicate = { foo: 0 }

    return Promise.all([
      expect(
        Promise.reject({ foo: 0 })::catchPlus(predicate, ident)
      ).to.resolve.to.be.an.object(),
      expect(
        Promise.reject({ foo: 1 })::catchPlus(predicate, ident)
      ).to.reject.to.be.an.object(),
      expect(
        Promise.reject({ bar: 0 })::catchPlus(predicate, ident)
      ).to.reject.to.be.an.object()
    ])
  })

  it('does not catch programmer errors', () => {
    return Promise.all([
      expect(
        Promise.reject(new TypeError(''))::catchPlus(ident)
      ).to.reject.to.error(TypeError),
      expect(
        Promise.reject(new SyntaxError(''))::catchPlus(ident)
      ).to.reject.to.error(SyntaxError),

      // Unless matches by a predicate.
      expect(
        Promise.reject(new TypeError(''))::catchPlus(TypeError, ident)
      ).to.resolve.to.error(TypeError)
    ])
  })
})

// -------------------------------------------------------------------

describe('forArray()', () => {
  it('iterates over an array of promises', () => {
    const spy = sinon.spy()

    const array = [
      Promise.resolve('foo'),
      Promise.resolve('bar'),
      'baz'
    ]
    return expect(array::forArray(spy)).to.resolve.to.undefined().then(() => {
      expect(spy.args).to.eql([
        [ 'foo', 0, array ],
        [ 'bar', 1, array ],
        [ 'baz', 2, array ]
      ])
    })
  })
})

// -------------------------------------------------------------------

describe('fromCallback()', () => {
  it('creates a promise which resolves with value passed to the callback', () => expect(fromCallback(cb => {
    cb(null, 'foo')
  })).to.resolve.to.equal('foo'))

  it('creates a promise which rejects with reason passed to the callback', () => expect(fromCallback(cb => {
    cb('bar')
  })).to.reject.to.equal('bar'))
})

// -------------------------------------------------------------------

describe('join()', () => {
  it('calls the callback once promises are resolved', () => join(
    Promise.resolve('foo'), Promise.resolve('bar'),
    (foo, bar) => {
      expect(foo).to.equal('foo')
      expect(bar).to.equal('bar')
    }
  ))

  it('can takes inputs in an array', () => join(
    [ Promise.resolve('foo'), Promise.resolve('bar') ],
    (foo, bar) => {
      expect(foo).to.equal('foo')
      expect(bar).to.equal('bar')
    }
  ))

  it('rejects if one promise rejects', () => expect(join(
    Promise.resolve('foo'), Promise.reject('bar'),
    (foo, bar) => {
      expect(foo).to.equal('foo')
      expect(bar).to.equal('bar')
    }
  )).to.reject.to.equal('bar'))
})

// -------------------------------------------------------------------

describe('lastly()', () => {
  it('calls a callback on resolution', () => {
    const value = {}
    const spy = sinon.spy()

    return expect(
      Promise.resolve(value)::lastly(spy)
    ).to.resolve.to.equal(
      value
    ).then(() => {
      expect(spy.callCount).to.equal(1)
    })
  })

  it('calls a callback on rejection', () => {
    const reason = {}
    const spy = sinon.spy()

    return expect(
      Promise.reject(reason)::lastly(spy)
    ).to.reject.to.equal(
      reason
    ).then(() => {
      expect(spy.callCount).to.equal(1)
    })
  })
})

// -------------------------------------------------------------------

describe('promisifyAll()', () => {
  it('returns a new object', () => {
    const o = {}
    const r = promisifyAll(o)

    expect(r).to.be.an.object()
    expect(r).to.not.equal(o)
  })

  it('creates promisified version of all functions bound to the original object', () => {
    const o = {
      foo (cb) {
        cb(null, this)
      }
    }
    const r = promisifyAll(o)

    return expect(r.foo()).to.resolve.to.equal(o)
  })

  it('ignores functions ending with Sync or Async', () => {
    const o = {
      fooAsync () {},
      fooSync () {}
    }
    const r = o::promisifyAll()

    expect(r).to.not.have.property('foo')
    expect(r).to.not.have.property('fooASync')
    expect(r).to.not.have.property('fooSync')
  })
})

// -------------------------------------------------------------------

describe('settle()', () => {
  it('works with arrays', () => {
    return [
      Promise.resolve(42),
      Math.PI,
      Promise.reject('fatality')
    ]::settle().then(([ status1, status2, status3 ]) => {
      expect(status1.isFulfilled()).to.equal(true)
      expect(status2.isFulfilled()).to.equal(true)
      expect(status3.isFulfilled()).to.equal(false)

      // Alias.
      expect(status1.isResolved()).to.equal(true)
      expect(status2.isResolved()).to.equal(true)
      expect(status3.isResolved()).to.equal(false)

      expect(status1.isRejected()).to.equal(false)
      expect(status2.isRejected()).to.equal(false)
      expect(status3.isRejected()).to.equal(true)

      expect(status1.value()).to.equal(42)
      expect(status2.value()).to.equal(Math.PI)
      expect(::status3.value).to.throw()

      expect(::status1.reason).to.throw()
      expect(::status2.reason).to.throw()
      expect(status3.reason()).to.equal('fatality')
    })
  })

  it('works with objects', () => {
    return {
      a: Promise.resolve(42),
      b: Math.PI,
      c: Promise.reject('fatality')
    }::settle().then(({
      a: status1,
      b: status2,
      c: status3
    }) => {
      expect(status1.isFulfilled()).to.equal(true)
      expect(status2.isFulfilled()).to.equal(true)
      expect(status3.isFulfilled()).to.equal(false)

      // Alias.
      expect(status1.isResolved()).to.equal(true)
      expect(status2.isResolved()).to.equal(true)
      expect(status3.isResolved()).to.equal(false)

      expect(status1.isRejected()).to.equal(false)
      expect(status2.isRejected()).to.equal(false)
      expect(status3.isRejected()).to.equal(true)

      expect(status1.value()).to.equal(42)
      expect(status2.value()).to.equal(Math.PI)
      expect(::status3.value).to.throw()

      expect(::status1.reason).to.throw()
      expect(::status2.reason).to.throw()
      expect(status3.reason()).to.equal('fatality')
    })
  })
})

// -------------------------------------------------------------------

describe('tap(cb)', () => {
  it('call cb with the resolved value', () => new Promise(resolve => {
    Promise.resolve('value')::tap(value => {
      expect(value).to.equal('value')
      resolve()
    })
  }))

  it('does not call cb if the promise is rejected', () => expect(
    Promise.reject('reason')::tap(() => Promise.reject('other reason'))
  ).to.reject.to.equal('reason'))

  it('forwards the resolved value', () => expect(
    Promise.resolve('value')::tap(() => 'other value')
  ).to.resolve.to.equal('value'))

  it('rejects if cb rejects', () => expect(
    Promise.resolve('value')::tap(() => Promise.reject('reason'))
  ).to.reject.to.equal('reason'))
})

describe('tap(null, cb)', () => {
  it('call cb with the rejected reason', () => new Promise(resolve => {
    Promise.reject('reason')::tap(null, reason => {
      expect(reason).to.equal('reason')
      resolve()
    })
  }))

  it('does not call cb if the promise is resolved', () => expect(
    Promise.resolve('value')::tap(null, () => Promise.reject('other reason'))
  ).to.resolve.to.equal('value'))

  it('forwards the rejected reason', () => expect(
    Promise.reject('reason')::tap(null, () => 'value')
  ).to.reject.to.equal('reason'))

  it('rejects if cb rejects', () => expect(
    Promise.reject('reason')::tap(null, () => Promise.reject('other reason'))
  ).to.reject.to.equal('other reason'))
})

// -------------------------------------------------------------------

describe('timeout()', () => {
  const neverSettle = new Promise(() => {})

  it('rejects a promise if not settled after a delay', () => expect(
    neverSettle::timeout(10)
  ).to.reject.to.error(TimeoutError))

  it('call the callback if not settled after a delay', () => expect(
    neverSettle::timeout(10, () => 'bar')
  ).to.resolve.to.equal('bar'))

  it('forwards the settlement if settled before a delay', () => Promise.all([
    expect(
      Promise.resolve('value')::timeout(10)
    ).to.resolve.to.equal('value'),
    expect(
      Promise.reject('reason')::timeout(10)
    ).to.reject.to.equal('reason')
  ]))

  it('rejects if cb throws synchronously', () => expect(
    neverSettle::timeout(10, () => {
      throw 'reason' // eslint-disable-line no-throw-literal
    })
  ).to.reject.to.equal('reason'))
})

// -------------------------------------------------------------------

describe('unpromisify()', () => {
  it('forwards the result', done => {
    const fn = unpromisify.call(() => Promise.resolve('foo'))

    fn((error, result) => {
      expect(error).to.not.exist()
      expect(result).to.equal('foo')

      done()
    })
  })

  it('forwards the error', done => {
    const fn = unpromisify.call(() => Promise.reject('foo'))

    fn(error => {
      expect(error).to.equal('foo')

      done()
    })
  })
})
