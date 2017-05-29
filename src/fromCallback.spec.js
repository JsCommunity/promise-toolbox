/* eslint-env jest */

import { fromCallback } from './'
import { hideLiteralErrorFromLinter, rejectionOf } from './fixtures'

describe('fromCallback()', () => {
  it('creates a promise which resolves with value passed to the callback', async () => {
    expect(await fromCallback(cb => cb(null, 'foo'))).toBe('foo')
  })

  it('creates a promise which rejects with reason passed to the callback', async () => {
    expect(await rejectionOf(fromCallback(cb => cb(hideLiteralErrorFromLinter('bar'))))).toBe('bar')
  })
})
