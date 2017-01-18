# promise-toolbox [![Build Status](https://travis-ci.org/JsCommunity/promise-toolbox.png?branch=master)](https://travis-ci.org/JsCommunity/promise-toolbox)

> Essential utils for promises.

Features:

- small (< 150 KB with all dependencies, < 5 KB with gzip)
- nice with ES2015 / ES2016 syntax

## Install

Installation of the [npm package](https://npmjs.org/package/promise-toolbox):

```
> npm install --save promise-toolbox
```

## Usage

If your environment may not natively support promises, you should use a polyfill such as [native-promise-only](https://github.com/getify/native-promise-only).

On Node, if you want to use a specific promise implementation,
[Bluebird](http://bluebirdjs.com/docs/why-bluebird.html) for instance
to have better performance, you can override the global Promise
variable:

```js
global.Promise = require('bluebird')
```

> Note that it should only be done at the application level, never in
> a library!

### Cancellation

This library provides an implementation of `CancelToken` from the
[cancelable promises specification](https://tc39.github.io/proposal-cancelable-promises/).

A cancel token is an object which can be passed to asynchronous
functions to represent cancellation state.

```js
import { CancelToken } from 'promise-toolbox'
```

#### Creation

A cancel token is created by the initiator of the async work and its
cancellation state may be requested at any time.

```js
// Create a token which requests cancellation when a button is clicked.
const token = new CancelToken(cancel => {
  $('#some-button').on('click', () => cancel('button clicked'))
})
```

```js
const { cancel, token } = CancelToken.source()
```

#### Consumption

The receiver of the token (the function doing the async work) can:

1. synchronously check whether cancellation has been requested
2. synchronously throw if cancellation has been requested
3. register a callback that will be executed if cancellation is requested
4. pass the token to subtasks

```js
// 1.
if (token.reason) {
  console.log('cancellation has been requested', token.reason.message)
}

// 2.
try {
  token.throwIfRequested()
} catch (reason) {
  console.log('cancellation has been requested', reason.message)
}

// 3.
token.promise.then(reason => {
  console.log('cancellation has been requested', reason.message)
})

// 4.
subtask(token)
```

#### Is cancel token?

```js
if (CancelToken.isCancelToken(value)) {
  console.log('value is a cancel token')
}
```

#### Combining cancel tokens

> Create a token which is cancelled as soon as one token amongst many
> is.

```js
// `token` will be cancelled (synchronously) as soon as `token1` or
// `token2` or token3` is, with the same reason.
const token = CancelToken.race([ token1, token2, token3 ])
```

#### @cancellable decorator

> Make your async functions cancellable.

If the first argument passed to the cancellable function is not a
cancel token, a new one is created and injected and the returned
promise will have a `cancel()` method.

```js
import { cancellable, CancelToken } from 'promise-toolbox'

const asyncFunction = cancellable(async ($cancelToken, a, b) => {
  $cancelToken.promise.then(() => {
    // do stuff regarding the cancellation request.
  })

  // do other stuff.
})

// Either a cancel token is passed:
const source = CancelToken.source()
const promise1 = asyncFunction(source.token, 'foo', 'bar')
source.cancel('reason')

// Or the returned promise will have a cancel() method:
const promise2 = asyncFunction('foo', 'bar')
promise2.cancel('reason')
```

If the function is a method of a class or an object, you can use
`cancellable` as a decorator:

```js
class MyClass {
  @cancellable
  async asyncMethod ($cancelToken, a, b) {
    // ...
  }
}
```

### Functions

#### defer()

> Discouraged but sometimes necessary way to create a promise.

```js
import { defer } from 'promise-toolbox'

const { promise, resolve } = defer()

promise.then(value => {
  console.log(value)
})

resolve(3)
```

#### fromCallback(cb => fn(arg1, ..., argn, cb))

> Easiest and most efficient way to promisify a function call.

```js
import { fromCallback } from 'promise-toolbox'

fromCallback(cb => fs.readFile('foo.txt', cb))
  .then(content => {
    console.log(content)
  })
```

#### isPromise(value)

```js
import { isPromise } from 'promise-toolbox'

if (isPromise(foo())) {
  console.log('foo() returns a promise')
}
```

#### join(p1, ..., pn, cb) / join([p1, ..., pn], cb)

> Easiest and most efficient way to wait for a fixed amount of
> promises.

```js
import { join } from 'promise-toolbox'

join(getPictures(), getComments(), getTweets(), (pictures, comments, tweets) => {
  console.log(`in total: ${pictures.length + comments.length + tweets.length}`)
})
```

#### promisify(fn, [ context ]) / promisifyAll(obj)

> Creates  async functions taking node-style callbacks, create new ones
> returning promises.

```js
import fs from 'fs'
import { promisify, promisifyAll } from 'promise-toolbox'

// Promisify a single function.
//
// If possible, the function name is kept and the new length is set.
const readFile = promisify(fs.readFile)

// Or all functions (own or inherited) exposed on a object.
const fsPromise = promisifyAll(fs)

readFile(__filename).then(content => console.log(content))

fsPromise.readFile(__filename).then(content => console.log(content))
```

### Pseudo-methods

This function can be used as if they were methods, i.e. by passing the
promise (or promises) as the context.

This is extremely easy using [ES2016's bind syntax](https://github.com/zenparsing/es-function-bind).

```js
const promises = [
  Promise.resolve('foo'),
  Promise.resolve('bar')
]

promises::all().then(values => {
  console.log(values)
})
// → [ 'foo', 'bar' ]
```

If you are still an older version of ECMAScript, fear not: simply pass
the promise (or promises) as the first argument of the `.call()`
method:

```js
var promises = [
  Promise.resolve('foo'),
  Promise.resolve('bar')
]

all.call(promises).then(function (values) {
  console.log(values)
})
// → [ 'foo', 'bar' ]
```

#### promises::all([ mapper ])

> Waits for all promises of a collection to be resolved.
>
> Contrary to the standard `Promise.all()`, this function works also
> with objects.

```js
import { all } from 'promise-toolbox'

[
  Promise.resolve('foo'),
  Promise.resolve('bar')
]::all().then(value => {
  console.log(value)
  // → ['foo', 'bar']
})

{
  foo: Promise.resolve('foo'),
  bar: Promise.resolve('bar')
}::all().then(value => {
  console.log(value)
  // → {
  //   foo: 'foo',
  //   bar: 'bar'
  // }
})
```

#### promise::asCallback(cb)

> Register a node-style callback on this promise.

```js
import { asCallback } from 'promise-toolbox'

// This function can be used either with node-style callbacks or with
// promises.
function getDataFor (input, callback) {
  return dataFromDataBase(input)::asCallback(callback)
}
```

#### promise::catchPlus(predicate, cb)

> Similar to `Promise#catch()` but:
>
> - support predicates
> - do not catch `ReferenceError`, `SyntaxError` or `TypeError` unless
>   they match a predicate because they are usually programmer errors
>   and should be handled separately.

```js
somePromise.then(() => {
  return a.b.c.d()
})::catchPlus(TypeError, ReferenceError, reason => {
  // Will end up here on programmer error
})::catchPlus(NetworkError, TimeoutError, reason => {
  // Will end up here on expected everyday network errors
})::catchPlus(reason => {
  // Catch any unexpected errors
})
```

#### promise::delay(ms)

> Delays the resolution of a promise by `ms` milliseconds.
>
> Note: the rejection is not delayed.

```js
console.log(await Promise.resolve('500ms passed')::delay(500))
// → 500 ms passed
```

Also works with a value:

```js
console.log(await delay.call('500ms passed', 500))
// → 500 ms passed
```

#### collection::forEach(cb)

> Iterates in order over a collection, or promise of collection, which
> contains a mix of promises and values, waiting for each call of cb
> to be resolved before the next one.

The returned promise will resolve to `undefined` when the iteration is
complete.

```js
[
  'foo',
  Promise.resolve('bar'),
]::forEach(value => {
  console.log(value)

  // Wait for the promise to be resolve before the next item.
  return new Promise(resolve => setTimeout(resolve, 10))
})
// →
// foo
// bar
```

#### promise::lastly(cb)

> Execute a handler regardless of the promise fate. Similar to the
> `finally` block in synchronous codes.
>
> The resolution value or rejection reason of the initial promise is
> forwarded unless the callback rejects.

```js
import { lastly } from 'promise-toolbox'

function ajaxGetAsync (url) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest
    xhr.addEventListener('error', reject)
    xhr.addEventListener('load', resolve)
    xhr.open('GET', url)
    xhr.send(null)
  })::lastly(() => {
    $('#ajax-loader-animation').hide()
  })
}
```

#### promise::reflect()

> Returns a promise which resolves to an objects which reflects the
> resolution of this promise.

```js
import { reflect } from 'promise-toolbox'

const inspection = await promise::reflect()

if (inspection.isFulfilled()) {
  console.log(inspection.value())
} else {
  console.error(inspection.reason())
}
```

#### promises::some(count)

> Waits for `count` promises in a collection to be resolved.

```js
import { some } from 'promise-toolbox'

const [ first, seconds ] = await [
  ping('ns1.example.org'),
  ping('ns2.example.org'),
  ping('ns3.example.org'),
  ping('ns4.example.org')
]::some(2)
```

#### promise::tap(onResolved, onRejected)

> Like `.then()` but the original resolution/rejection is forwarded.
>
> Like `::lastly()`, if the callback rejects, it takes over the
> original resolution/rejection.

```js
import { tap } from 'promise-toolbox'

// Contrary to .then(), using ::tap() does not change the resolution
// value.
const promise1 = Promise.resolve(42)::tap(value => {
  console.log(value)
})

// Like .then, the second param is used in case of rejection.
const promise2 = Promise.reject(42)::tap(null, reason => {
  console.error(reason)
})
```

#### promise::timeout(ms, [cb])

> Call a callback if the promise is still pending after `ms`
> milliseconds. Its resolution/rejection is forwarded.
>
> If the callback is omitted, the returned promise is rejected with a
> `Timeout` error.

```js
import { timeout } from 'promise-toolbox'

await doLongOperation()::timeout(100, () => {
  return doFallbackOperation()
})

await doLongOperation()::timeout(100)
```

## Development

```
# Install dependencies
> npm install

# Run the tests
> npm test

# Continuously compile
> npm run dev

# Continuously run the tests
> npm run dev-test

# Build for production (automatically called by npm install)
> npm run build
```

## Contributions

Contributions are *very* welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/JsCommunity/promise-toolbox/issues)
  you've encountered;
- fork and create a pull request.

## License

ISC © [Julien Fontanet](https://github.com/julien-f)
