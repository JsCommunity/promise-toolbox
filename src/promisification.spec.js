/* eslint-env jest */

import { promisifyAll, unpromisify } from './'
import { reject } from './fixtures'

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
