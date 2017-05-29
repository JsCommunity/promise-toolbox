/* eslint-env jest */

import { all } from './'
import { reject, rejectionOf } from './fixtures'

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
