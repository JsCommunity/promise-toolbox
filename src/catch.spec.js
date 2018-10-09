/* eslint-env jest */

const makeError = require('make-error')

const pCatch = require('./catch')
const identity = require('./_identity')
const { reject } = require('./fixtures')

describe('catch', () => {
  it('catches errors matching a predicate', async () => {
    const predicate = reason => reason === 'foo'

    expect(await reject('foo')::pCatch(predicate, identity)).toBe('foo')

    await expect(reject('bar')::pCatch(predicate, identity)).rejects.toBe(
      'bar'
    )
  })

  it('catches errors matching a class', async () => {
    const CustomError1 = makeError('CustomError1')
    const CustomError2 = makeError('CustomError2')

    const error = new CustomError1()

    // The class itself.
    expect(await Promise.reject(error)::pCatch(CustomError1, identity)).toBe(
      error
    )

    // A parent.
    expect(await Promise.reject(error)::pCatch(Error, identity)).toBe(error)

    // Another class.
    await expect(
      Promise.reject(error)::pCatch(CustomError2, identity)
    ).rejects.toBe(error)
  })

  it('catches errors matching an object pattern', async () => {
    const predicate = { foo: 0 }

    expect(await reject({ foo: 0 })::pCatch(predicate, identity)).toEqual({
      foo: 0,
    })

    await expect(
      reject({ foo: 1 })::pCatch(predicate, identity)
    ).rejects.toEqual({ foo: 1 })

    await expect(
      reject({ bar: 0 })::pCatch(predicate, identity)
    ).rejects.toEqual({ bar: 0 })
  })

  it('does not catch programmer errors', async () => {
    await expect(
      Promise.reject(new ReferenceError(''))::pCatch(identity)
    ).rejects.toBeInstanceOf(ReferenceError)
    await expect(
      Promise.reject(new SyntaxError(''))::pCatch(identity)
    ).rejects.toBeInstanceOf(SyntaxError)
    await expect(
      Promise.reject(new TypeError(''))::pCatch(identity)
    ).rejects.toBeInstanceOf(TypeError)

    // Unless matches by a predicate.
    expect(
      await Promise.reject(new TypeError(''))::pCatch(TypeError, identity)
    ).toBeInstanceOf(TypeError)
  })
})
