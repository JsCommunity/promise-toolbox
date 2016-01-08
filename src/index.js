import AnyPromise from 'any-promise'
import { BaseError } from 'make-error'

// ===================================================================

const _toString = Object.prototype.toString

const _endsWith = (str, suffix, pos = str.length) => {
  pos -= suffix.length
  return str.indexOf(suffix, pos) === pos
}

const _isArray = Array.isArray || (tag =>
  value => _toString.call(value) === tag
)(_toString.call([]))

const _isFunction = (tag =>
  value => _toString.call(value) === tag
)(_toString.call(_toString))

const _isLength = value => (
  typeof value === 'number' &&
  value >= 0 && value < Infinity &&
  Math.floor(value) === value
)

const _isArrayLike = value => value && _isLength(value.length)

const _isIterable = typeof Symbol === 'function'
  ? value => value && _isFunction(value[Symbol.iterator])
  : () => false

const _noop = () => {}

// -------------------------------------------------------------------

const _forArray = (array, iteratee) => {
  const { length } = array
  for (let i = 0; i < length; ++i) {
    iteratee(array[i], i, array)
  }
}

const _forIn = (object, iteratee) => {
  for (const key in object) {
    iteratee(object[key], key, object)
  }
}

const _forIterable = (iterable, iteratee) => {
  const iterator = iterable[Symbol.iterator]()

  let current
  while (!(current = iterator.next()).done) {
    iteratee(current.value, null, iterable)
  }
}

const { hasOwnProperty } = Object.prototype
const _forOwn = (object, iteratee) => {
  for (const key in object) {
    if (hasOwnProperty.call(object, key)) {
      iteratee(object[key], key, object)
    }
  }
}

const _forEach = (collection, iteratee) => _isArray(collection)
  ? _forArray(collection, iteratee)
  : _isIterable(collection)
    ? _forIterable(collection, iteratee)
    : _isArrayLike(collection)
      ? _forArray(collection, iteratee)
      : _forOwn(collection, iteratee)

const _map = (collection, iteratee) => {
  const result = _isArrayLike(collection)
    ? new Array(collection.length)
    : {}

  // If iteratee is not a function, simply returns the new container.
  if (iteratee) {
    _forEach(collection, (item, key) => {
      result[key] = iteratee(item, key, collection)
    })
  }

  return result
}

// -------------------------------------------------------------------

const _makeAsyncIterator = iterator => (promises, cb) => {
  let mainPromise = AnyPromise.resolve()

  iterator(promises, (promise, key) => {
    mainPromise = mainPromise

      // Waits the current promise.
      .then(() => promise)

      // Executes the callback.
      .then(value => cb(value, key))
  })

  return mainPromise
}

const _forEachAsync = _makeAsyncIterator(_forEach)

// ===================================================================

const _all = (promises, mapFn) => {
  // mapFn may be undefined but it's okay :)
  const results = _map(promises, mapFn)

  return _forEachAsync(results, (value, key) => {
    results[key] = value
  }).then(() => results)
}

// Returns a promise which resolves when all the promises in a
// collection have resolved or rejects with the reason of the first
// promise that rejects.
//
// Optionally a function can be provided to map all items in the
// collection before waiting for completion.
//
// Usage: promises::all([ mapFn ])
export function all (mapFn) {
  return AnyPromise.resolve(this)
    .then(promises => _all(promises, mapFn))
}

// -------------------------------------------------------------------

// Usage: promise::asCallback(cb)
export function asCallback (cb) {
  // cb can be undefined.
  if (cb) {
    this.then(
      value => cb(null, value),
      error => cb(error)
    ).catch(_noop)
  }

  return this
}

export { asCallback as nodeify }

// -------------------------------------------------------------------

// Usage:
//
//     @cancellable
//     async fn (cancellation, other, args) {
//       cancellation.catch(() => {
//         // do stuff regarding the cancellation request.
//       })
//
//       // do other stuff.
//     }
export const cancellable = (target, name, descriptor) => {
  const fn = descriptor
    ? descriptor.value
    : target

  function newFn (...args) {
    let reject
    const cancellation = new Promise((_, reject_) => {
      reject = reject_
    })
    cancellation.catch(_noop)

    const promise = fn.call(this, cancellation, ...args)

    promise.cancel = reject

    return promise
  }

  return descriptor
    ? (descriptor.value = newFn, descriptor)
    : newFn
}

// -------------------------------------------------------------------

// Discouraged but sometimes necessary way to create a promise.
export const defer = () => {
  let resolve, reject
  const promise = new AnyPromise((resolve_, reject_) => {
    resolve = resolve_
    reject = reject_
  })

  return {
    promise,
    reject,
    resolve
  }
}

// -------------------------------------------------------------------

// Usage: promise::delay(ms)
export function delay (ms) {
  return AnyPromise.resolve(this).then(value => new AnyPromise(resolve => {
    setTimeout(() => resolve(value), ms)
  }))
}

// -------------------------------------------------------------------

export const makeAsyncIterator = iterator => {
  const asyncIterator = _makeAsyncIterator(iterator)

  return function (cb) {
    return AnyPromise.resolve(this)
      .then(promises => asyncIterator(promises, cb))
      .then(_noop) // Resolves to undefined
  }
}

export const forArray = makeAsyncIterator(_forArray)
export const forEach = makeAsyncIterator(_forEach)
export const forIn = makeAsyncIterator(_forIn)
export const forIterable = makeAsyncIterator(_forIterable)
export const forOwn = makeAsyncIterator(_forOwn)

// -------------------------------------------------------------------

// Usage:
//
//     fromCallback(cb => fs.readFile('foo.txt', cb))
//       .then(content => {
//         console.log(content)
//       })
export const fromCallback = fn => new AnyPromise((resolve, reject) => {
  fn((error, result) => error
    ? reject(error)
    : resolve(result)
  )
})

// -------------------------------------------------------------------

// Usage: join(p1, ..., pn, cb) or join([p1, ..., pn], cb)
export function join () {
  const n = arguments.length - 1
  const cb = arguments[n]

  let args
  if (n !== 2 || !_isArrayLike(args = arguments[0])) {
    args = new Array(n)
    let mainPromise = AnyPromise.resolve()
    for (let i = 0; i < n; ++i) {
      const promise = arguments[i]

      mainPromise = mainPromise
        .then(() => promise)
        .then(value => { args[i] = value })
    }
  }

  return new AnyPromise(resolve => {
    resolve(cb.apply(null, args))
  })
}

// -------------------------------------------------------------------

// Ponyfill for Promise.finally(cb)
//
// Usage: promise::lastly(cb)
export function lastly (cb) {
  return this.then(
    value => AnyPromise.resolve(cb()).then(() => value),
    reason => AnyPromise.resolve(cb()).then(() => {
      throw reason
    })
  )
}
export { lastly as finally }

// -------------------------------------------------------------------

const _setFunctionNameAndLength = (() => {
  const _defineProperties = Object.defineProperties

  try {
    const f = _defineProperties(function () {}, {
      length: { value: 2 },
      name: { value: 'foo' }
    })

    if (f.length === 2 && f.name === 'foo') {
      return (fn, name, length) => _defineProperties(fn, {
        length: {
          configurable: true,
          value: length
        },
        name: {
          configurable: true,
          value: name
        }
      })
    }
  } catch (_) {}

  return fn => fn
})()

// Usage: fn::promisify([ thisArg ])
export function promisify (thisArg) {
  const fn = this

  return _setFunctionNameAndLength(function () {
    const { length } = arguments
    const args = new Array(length + 1)
    for (let i = 0; i < length; ++i) {
      args[i] = arguments[i]
    }

    return new AnyPromise((resolve, reject) => {
      args[length] = (error, result) => error
        ? reject(error)
        : resolve(result)

      fn.apply(thisArg || this, args)
    })
  }, fn.name, fn.length && fn.length - 1)
}

// Usage: obj::promisifyAll([ mapper ])
const DEFAULT_PALL_MAPPER = (name, fn) => (
  !(_endsWith(name, 'Sync') || _endsWith(name, 'Async')) &&
  `${name}Async`
)
export function promisifyAll (mapper = DEFAULT_PALL_MAPPER) {
  const result = {}

  _forIn(this, (value, name) => {
    let newName
    if (
      typeof value === 'function' &&
      (newName = mapper(name, value, this))
    ) {
      this[newName] = promisify(value)
    }
  })

  return result
}

// -------------------------------------------------------------------

const FN_FALSE = () => false
const FN_TRUE = () => true

const _reflectResolution = (__proto__ => value => ({
  __proto__,
  value: () => value
}))({
  isFulfilled: FN_TRUE,
  isPending: FN_FALSE,
  isRejected: FN_FALSE,
  isResolved: FN_TRUE,
  reason: () => {
    throw new Error('no reason, the promise has resolved')
  }
})

const _reflectRejection = (__proto__ => reason => ({
  __proto__,
  reason: () => reason
}))({
  isFulfilled: FN_FALSE,
  isPending: FN_FALSE,
  isRejected: FN_TRUE,
  isResolved: FN_FALSE,
  value: () => {
    throw new Error('no value, the promise has rejected')
  }
})

// Returns a promise that is always successful when this promise is
// settled. Its fulfillment value is an object that implements the
// PromiseInspection interface and reflects the resolution this
// promise.
//
// Usage: promise::reflect()
export function reflect () {
  return AnyPromise.resolve(this).then(
    _reflectResolution,
    _reflectRejection
  )
}

// -------------------------------------------------------------------

// Given a collection (array or object) which contains promises,
// return a promise that is fulfilled when all the items in the
// collection are either fulfilled or rejected.
//
// This promise will be fulfilled with a collection (of the same type,
// array or object) containing promise inspections.
//
// Usage: promises::settle()
export function settle () {
  return this::all(x => x::reflect())
}

// -------------------------------------------------------------------

const _some = (promises, count) => new AnyPromise((resolve, reject) => {
  let values = []
  let errors = []

  const onFulfillment = value => {
    if (!values) {
      return
    }

    values.push(value)
    if (--count) {
      resolve(values)
      values = errors = null
    }
  }

  let acceptableErrors = -count
  const onRejection = reason => {
    if (!values) {
      return
    }

    errors.push(reason)
    if (--acceptableErrors) {
      reject(errors)
      values = errors = null
    }
  }

  _forEach(promises, promise => {
    ++acceptableErrors
    AnyPromise.resolve(promise).then(onFulfillment, onRejection)
  })
})

// Usage: promises::some(count)
export function some (count) {
  return AnyPromise.resolve(this)
    .then(promises => _some(promises, count))
}

// -------------------------------------------------------------------

export class TimeoutError extends BaseError {
  constructor () {
    super('operation timed out')
  }
}

// Usage: promise::timeout(ms)
export function timeout (ms) {
  return new AnyPromise((resolve, reject) => {
    const handle = setTimeout(() => {
      reject(new TimeoutError())

      if (_isFunction(this.cancel)) {
        this.cancel()
      }
    }, ms)

    AnyPromise.resolve(this).then(
      value => {
        clearTimeout(handle)
        resolve(value)
      },
      reason => {
        clearTimeout(handle)
        reject(reason)
      }
    )
  })
}
