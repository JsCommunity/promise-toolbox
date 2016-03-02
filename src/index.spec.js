/* eslint-env mocha */

import expect from 'must'
import makeError from 'make-error'
import sinon from 'sinon'

import {
  catchPlus,
  fromCallback,
  join,
  lastly,
  promisifyAll,
  settle,
  timeout,
  TimeoutError
} from './'

// ===================================================================

describe('catchPlus', () => {
  const ident = (value) => value

  it('catches errors matching a predicate', () => {
    const predicate = (reason) => reason === 'foo'

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

describe('fromCallback()', () => {
  it('creates a promise which resolves with value passed to the callback', () => expect(fromCallback((cb) => {
    cb(null, 'foo')
  })).to.resolve.to.equal('foo'))

  it('creates a promise which rejects with reason passed to the callback', () => expect(fromCallback((cb) => {
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
    const r = o::promisifyAll()

    expect(r).to.be.an.object()
    expect(r).to.not.equal(o)
  })

  it('creates promisified version of all functions bound to the original object', () => {
    const o = {
      foo (cb) {
        cb(null, this)
      }
    }
    const r = o::promisifyAll()

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

describe('timeout()', () => {
  it('rejects a promise if not settled after a delay', () => expect(
    new Promise(() => {})::timeout(10)
  ).to.reject.to.error(TimeoutError))

  it('forwards the settlement if settled before a delay', () => Promise.all([
    expect(
      Promise.resolve('value')::timeout(10)
    ).to.resolve.to.equal('value'),
    expect(
      Promise.reject('reason')::timeout(10)
    ).to.reject.to.equal('reason')
  ]))
})
