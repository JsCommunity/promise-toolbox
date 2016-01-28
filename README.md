# promise-toolbox [![Build Status](https://travis-ci.org/julien-f/js-promise-toolbox.png?branch=master)](https://travis-ci.org/julien-f/js-promise-toolbox)

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

### Decorators

#### cancellable

> Make your async functions cancellable.

```js
import { cancellable } from 'promise-toolbox'

const asyncFunction = cancellable(async function (cancellation, a, b) {
  cancellation.catch(() => {
    // do stuff regarding the cancellation request.
  })

  // do other stuff.
})

const promise = asyncFunction('foo', 'bar')
promise.cancel()
```

If the function is a method of a class or an object, you can use
`cancellable` as a decorator:

```js
class MyClass {
  @cancellable
  async asyncMethod (cancellation, a, b) {
    cancellation.catch(() => {
      // do stuff regarding the cancellation request.
    })

  // do other stuff.
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

console.log([
  Promise.resolve('foo'),
  Promise.resolve('bar')
]::all())
// → ['foo', 'bar']

console.log({
  foo: Promise.resolve('foo'),
  bar: Promise.resolve('bar')
}::all())
// → {
//   foo: 'foo',
//   bar: 'bar'
// }
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

#### promises::forEach(cb)

> Iterates in order over a collection of promises waiting for each of
> them to be resolved.

```js
[
  Promise.resolve('foo'),
  Promise.resolve('bar'),
]::forEach(value => {
  console.log(value)
})
// →
// foo
// bar
```

#### promise::lastly(cb)

> Execute a handler regardless of the promise fate. Similar to the
> `finally` block in synchronous codes.
>
> The resolution value or rejection reason of the initial promise if
> forwarded.

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

#### fn::promisify([ thisArg ]) / obj::promisifyAll()

> Creates  async functions taking node-style callbacks, create new ones
> returning promises.

```js
import fs from 'fs'
import { promisify, promisifyAll } from 'promise-toolbox'

// Promisify a single function.
//
// If possible, the function name is kept and the new length is set.
const readFile = fs.readFile::promisify()

// Or all functions (own or inherited) exposed on a object.
const fsPromise = fs::promisifyAll()

readFile(__filename).then(content => console.log(content))

fsPromise.readFileAsync(__filename).then(content => console.log(content))
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

#### promise::timeout(ms)

> Automatically rejects a promise if it is still pending after `ms`
> milliseconds.

```js
await doLongOperation()::timeout(100)
```

## Development

### Installing dependencies

```
> npm install
```

### Compilation

The sources files are watched and automatically recompiled on changes.

```
> npm run dev
```

### Tests

```
> npm run test-dev
```

## Contributions

Contributions are *very* welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/julien-f/js-promise-toolbox/issues)
  you've encountered;
- fork and create a pull request.

## License

ISC © [Julien Fontanet](https://github.com/julien-f)
