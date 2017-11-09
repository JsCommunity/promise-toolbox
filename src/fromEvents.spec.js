/* eslint-env jest */

const { EventEmitter } = require('events')

const fromEvents = require('./fromEvents')

const arg1 = 'arg1'
const arg2 = 'arg2'
const emitter = new EventEmitter()

describe('fromEvents()', () => {
  it('resolves if one of the success events is emitted', () => {
    const promise = fromEvents(emitter, ['foo', 'bar'])
    emitter.emit('foo', arg1, arg2)

    return promise.then(value => {
      expect(value.event).toBe('foo')
      expect(value.slice()).toEqual([arg1, arg2])
    })
  })

  // -----------------------------------------------------------------

  it('rejects if one of the error events is emitted', () => {
    const promise = fromEvents(emitter, [], ['foo', 'bar'])
    emitter.emit('bar', arg1)

    return promise.catch(value => {
      expect(value.event).toBe('bar')
      expect(value.slice()).toEqual([arg1])
    })
  })
})
