/* eslint-env jest */

import { ignoreErrors } from './'
import { reject, rejectionOf } from './fixtures'

describe('ignoreErrors()', () => {
  it('swallows errors', () => {
    return reject('foo')::ignoreErrors()
  })

  it('does not swallow programmer errors', async () => {
    expect(
      await rejectionOf(Promise.reject(new ReferenceError(''))::ignoreErrors())
    ).toBeInstanceOf(ReferenceError)
    expect(
      await rejectionOf(Promise.reject(new SyntaxError(''))::ignoreErrors())
    ).toBeInstanceOf(SyntaxError)
    expect(
      await rejectionOf(Promise.reject(new TypeError(''))::ignoreErrors())
    ).toBeInstanceOf(TypeError)
  })
})
