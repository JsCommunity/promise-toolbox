/* eslint-env jest */

import { attempt, try as try_ } from './'
import { throwArg, rejectionOf } from './fixtures'

describe('try()', () => {
  it('wraps returned value in promise', () => {
    return try_(() => 'foo').then(value => {
      expect(value).toBe('foo')
    })
  })

  it('wraps thrown exception in promise', () => {
    return rejectionOf(try_(() => throwArg('foo'))).then(exception => {
      expect(exception).toBe('foo')
    })
  })

  it('calls the callback synchronously', () => {
    const spy = jest.fn()
    try_(spy)

    expect(spy).toHaveBeenCalled()
  })

  it('is aliased as attempt', () => {
    expect(attempt).toBe(try_)
  })
})
