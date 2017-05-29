/* eslint-env jest */

import { join } from './'
import { reject, rejectionOf } from './fixtures'

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
