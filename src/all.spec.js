/* eslint-env jest */

const all = require('./all')
const noop = require('./_noop')
const { reject } = require('./fixtures')

describe('all()', () => {
  it('with array', async () => {
    expect(await [Promise.resolve('foo'), 'bar']::all()).toEqual(['foo', 'bar'])
  })

  it('with object', async () => {
    expect(
      await {
        foo: Promise.resolve('foo'),
        bar: 'bar',
      }::all()
    ).toEqual({
      foo: 'foo',
      bar: 'bar',
    })
  })

  it('resolve with empty collection', async () => {
    expect(await []::all()).toEqual([])
  })

  it('rejects first rejection', async () => {
    await expect(['foo', reject('bar')]::all()).rejects.toBe('bar')
  })

  it('rejects first rejection (even with pending promises)', async () => {
    await expect([new Promise(noop), reject('bar')]::all()).rejects.toBe('bar')
  })
})
