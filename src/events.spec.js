/* eslint-env jest */

import { EventEmitter } from 'events'

import { fromEvent, fromEvents } from './'
import { noop, rejectionOf } from './fixtures'

const arg1 = 'arg1'
const arg2 = 'arg2'
const emitter = new EventEmitter()

describe('fromEvent()', () => {
  it('waits for an event', () => {
    var promise = fromEvent(emitter, 'foo')

    emitter.emit('foo')

    return promise
  })

  // -----------------------------------------------------------------

  it('forwards first event arg', () => {
    var promise = fromEvent(emitter, 'foo')
    emitter.emit('foo', arg1, arg2)

    return promise.then(value => {
      expect(value).toBe(arg1)
    })
  })

  // -----------------------------------------------------------------

  describe('array option', () => {
    it('forwards all args as an array', () => {
      var promise = fromEvent(emitter, 'foo', {
        array: true
      })
      emitter.emit('foo', arg1, arg2)

      return promise.then(value => {
        expect(value.event).toBe('foo')
        expect(value.slice()).toEqual([ arg1, arg2 ])
      })
    })
  })

  // -----------------------------------------------------------------

  it('resolves if event is error event', () => {
    const promise = fromEvent(emitter, 'error')
    emitter.emit('error')
    return promise
  })

  // -----------------------------------------------------------------

  it('handles error event', () => {
    var error = new Error()

    var promise = fromEvent(emitter, 'foo')
    emitter.emit('error', error)

    return rejectionOf(promise).then(value => {
      expect(value).toBe(error)
    })
  })

  // -----------------------------------------------------------------

  describe('error option', () => {
    it('handles a custom error event', () => {
      var error = new Error()

      var promise = fromEvent(emitter, 'foo', {
        error: 'test-error'
      })
      emitter.emit('test-error', error)

      return rejectionOf(promise).then(value => {
        expect(value).toBe(error)
      })
    })
  })

  // -----------------------------------------------------------------

  describe('ignoreErrors option', () => {
    it('ignores error events', () => {
      var error = new Error()

      // Node requires at least one error listener.
      emitter.once('error', noop)

      var promise = fromEvent(emitter, 'foo', {
        ignoreErrors: true
      })
      emitter.emit('error', error)
      emitter.emit('foo', arg1)

      return promise.then(value => {
        expect(value).toBe(arg1)
      })
    })
  })

  // -----------------------------------------------------------------

  it('removes listeners after event', () => {
    var promise = fromEvent(emitter, 'foo')
    emitter.emit('foo')

    return promise.then(() => {
      expect(emitter.listeners('foo')).toEqual([])
      expect(emitter.listeners('error')).toEqual([])
    })
  })

  // -----------------------------------------------------------------

  it('removes listeners after error', () => {
    var promise = fromEvent(emitter, 'foo')
    emitter.emit('error')

    return promise.catch(() => {
      expect(emitter.listeners('foo')).toEqual([])
      expect(emitter.listeners('error')).toEqual([])
    })
  })
})

describe('fromEvents()', () => {
  it('resolves if one of the success events is emitted', () => {
    var promise = fromEvents(emitter, [ 'foo', 'bar' ])
    emitter.emit('foo', arg1, arg2)

    return promise.then(value => {
      expect(value.event).toBe('foo')
      expect(value.slice()).toEqual([ arg1, arg2 ])
    })
  })

  // -----------------------------------------------------------------

  it('rejects if one of the error events is emitted', () => {
    var promise = fromEvents(emitter, [], [ 'foo', 'bar' ])
    emitter.emit('bar', arg1)

    return rejectionOf(promise).then(value => {
      expect(value.event).toBe('bar')
      expect(value.slice()).toEqual([ arg1 ])
    })
  })
})
