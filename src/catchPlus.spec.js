/* eslint-env jest */

import makeError from 'make-error'

import { catchPlus } from './'
import { reject, identity, rejectionOf } from './fixtures'

describe('catchPlus', () => {
  it('catches errors matching a predicate', async () => {
    const predicate = reason => reason === 'foo'

    expect(
      await reject('foo')::catchPlus(predicate, identity)
    ).toBe('foo')

    expect(
      await rejectionOf(reject('bar')::catchPlus(predicate, identity))
    ).toBe('bar')
  })

  it('catches errors matching a class', async () => {
    const CustomError1 = makeError('CustomError1')
    const CustomError2 = makeError('CustomError2')

    const error = new CustomError1()

    // The class itself.
    expect(
      await Promise.reject(error)::catchPlus(CustomError1, identity)
    ).toBe(error)

    // A parent.
    expect(
      await Promise.reject(error)::catchPlus(Error, identity)
    ).toBe(error)

    // Another class.
    expect(
      await rejectionOf(Promise.reject(error)::catchPlus(CustomError2, identity))
    ).toBe(error)
  })

  it('catches errors matching an object pattern', async () => {
    const predicate = { foo: 0 }

    expect(
      typeof await reject({ foo: 0 })::catchPlus(predicate, identity)
    ).toBe('object')

    expect(
      typeof await rejectionOf(reject({ foo: 1 })::catchPlus(predicate, identity))
    ).toBe('object')

    expect(
      typeof await rejectionOf(reject({ bar: 0 })::catchPlus(predicate, identity))
    ).toBe('object')
  })

  it('does not catch programmer errors', async () => {
    expect(
      await rejectionOf(Promise.reject(new ReferenceError(''))::catchPlus(identity))
    ).toBeInstanceOf(ReferenceError)
    expect(
      await rejectionOf(Promise.reject(new SyntaxError(''))::catchPlus(identity))
    ).toBeInstanceOf(SyntaxError)
    expect(
      await rejectionOf(Promise.reject(new TypeError(''))::catchPlus(identity))
    ).toBeInstanceOf(TypeError)

    // Unless matches by a predicate.
    expect(
      await Promise.reject(new TypeError(''))::catchPlus(TypeError, identity)
    ).toBeInstanceOf(TypeError)
  })
})
