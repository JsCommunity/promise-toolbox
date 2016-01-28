/* eslint-env mocha */

import expect from 'must'
import sinon from 'sinon'

import {
  fromCallback,
  join,
  lastly,
  settle
} from './'

// ===================================================================

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
