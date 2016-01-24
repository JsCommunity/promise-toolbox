/* eslint-env mocha */

import AnyPromise from 'any-promise'
import expect from 'must'
import sinon from 'sinon'

import {
  join,
  lastly,
  settle
} from './'

// ===================================================================

describe('join()', () => {
  it('calls the callback once promises are resolved', () => join(
    AnyPromise.resolve('foo'), AnyPromise.resolve('bar'),
    (foo, bar) => {
      expect(foo).to.equal('foo')
      expect(bar).to.equal('bar')
    }
  ))

  it('can takes inputs in an array', () => join(
    [ AnyPromise.resolve('foo'), AnyPromise.resolve('bar') ],
    (foo, bar) => {
      expect(foo).to.equal('foo')
      expect(bar).to.equal('bar')
    }
  ))

  it('rejects if one promise rejects', () => expect(join(
    AnyPromise.resolve('foo'), AnyPromise.reject('bar'),
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
      AnyPromise.resolve(value)::lastly(spy)
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
      AnyPromise.reject(reason)::lastly(spy)
    ).to.reject.to.equal(
      reason
    ).then(() => {
      expect(spy.callCount).to.equal(1)
    })
  })
})

// -------------------------------------------------------------------

describe('settle()', () => {
  it('works with arrays', () => {
    return [
      AnyPromise.resolve(42),
      Math.PI,
      AnyPromise.reject('fatality')
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
      a: AnyPromise.resolve(42),
      b: Math.PI,
      c: AnyPromise.reject('fatality')
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
