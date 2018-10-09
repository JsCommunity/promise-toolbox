/* eslint-env jest */

const noop = require('./_noop')
const tap = require('./tap')
const { reject } = require('./fixtures')

describe('tap(cb)', () => {
  it('call cb with the resolved value', () =>
    new Promise(resolve => {
      Promise.resolve('value')::tap(value => {
        expect(value).toBe('value')
        resolve()
      })
    }))

  it('does not call cb if the promise is rejected', async () => {
    await expect(
      reject('reason')::tap(() => reject('other reason'))
    ).rejects.toBe('reason')
  })

  it('forwards the resolved value', async () => {
    expect(await Promise.resolve('value')::tap(() => 'other value')).toBe(
      'value'
    )
  })

  it('rejects if cb rejects', async () => {
    await expect(
      Promise.resolve('value')::tap(() => reject('reason'))
    ).rejects.toBe('reason')
  })
})

describe('tap(undefined, cb)', () => {
  it('call cb with the rejected reason', () =>
    new Promise(resolve => {
      reject('reason')
        ::tap(undefined, reason => {
          expect(reason).toBe('reason')
          resolve()
        })
        .catch(noop) // prevents the unhandled rejection warning
    }))

  it('does not call cb if the promise is resolved', async () => {
    expect(
      await Promise.resolve('value')::tap(undefined, () =>
        reject('other reason')
      )
    ).toBe('value')
  })

  it('forwards the rejected reason', async () => {
    await expect(reject('reason')::tap(undefined, () => 'value')).rejects.toBe(
      'reason'
    )
  })

  it('rejects if cb rejects', async () => {
    await expect(
      reject('reason')::tap(undefined, () => reject('other reason'))
    ).rejects.toBe('other reason')
  })
})
