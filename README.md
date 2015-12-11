# promise-utils [![Build Status](https://travis-ci.org/julien-f/js-promise-utils.png?branch=master)](https://travis-ci.org/julien-f/js-promise-utils)

> Essential utils for promises.

Some of Bluebird's goodies for all promises!

## Install

Installation of the [npm package](https://npmjs.org/package/promise-utils):

```
> npm install --save promise-utils
```

## Usage

#### all(promises, [ mapper ])

> Waits for all promises of a collection to be resolved.
>
> Contrary to the standard `Promise.all()`, this function works also
> with objects.

```js
import { all } from 'promise-utils'

console.log(all({
  foo: Promise.resolve('foo'),
  bar: Promise.resolve('bar')
}))
// → {
//   foo: 'foo',
//   bar: 'bar'
// }

// ES2016 syntax.
console.log({
  foo: Promise.resolve('foo'),
  bar: Promise.resolve('bar')
}::all())
// → {
//   foo: 'foo',
//   bar: 'bar'
// }
```

#### asCallback(promise, cb)

> Register a node-style callback on this promise.

```js
import { asCallback } from 'promise-utils'

// This function can be used either with node-style callbacks or with
// promises.
function getDataFor (input, callback) {
  return asCallback(dataFromDataBase(input), callback)

  // ES2016 syntax.
  return dataFromDataBase(input)::asCallback(callback)
}
```

#### cancellable

> Make your async functions cancellable.

```js
import { cancellable } from 'promise-utils'

@cancellable
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

#### delay([ value ], ms)

> Returns a promise that will be resolved in `ms` milliseconds.

`value` may be a promise.

```js
console.log(await delay('500ms passed', 500))
// → 500 ms passed
```

#### join(p1, ..., pn, cb)

> Easiest and most efficient way to wait for a fixed amount of
> promises.

```js
import { join } from 'promise-utils'

join(getPictures(), getComments(), getTweets(), (pictures, comments, tweets) => {
  console.log(`in total: ${pictures.length + comments.length + tweets.length}`)
})
```

#### lastly(promise, cb)

> Execute a handler regardless of the promise fate. Similar to the
> `finally` block in synchronous codes.
>
> The resolution value or rejection reason of the initial promise if
> forwarded.

```js
import { lastly } from 'promise-utils'

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

#### promisify(fn) / promisifyAll(obj)

> From async functions taking node-style callbacks, create new ones
> returning promises.

```js
import fs from 'fs'
import { promisify, promisifyAll } from 'promise-utils'

// Promisify a single function.
const readFile = promisify(fs.readFile)

// Or all functions (own or inherited) exposed on a object.
const fsPromise = promisifyAll(fs)

// ES2016 syntax.
const readFile = fs.readFile::promisify()
const fsPromise = fs::promisifyAll()

readFile(__filename).then(content => console.log(content))

fsPromise.readFileAsync(__filename).then(content => console.log(content))
```

#### reflect(promise)

> Returns a promise which resolves to an objects which reflects the
> resolution of this promise.

```js
import { reflect } from 'promise-utils'

const inspection = await reflect(reflect)

// ES2016 syntax.
const inspection = await promise::reflect()

if (inspection.isFulfilled()) {
  console.log(inspection.value())
} else {
  console.error(inspection.reason())
}
```

#### some(promises, count)

> Waits for `count` promises in a collection to be resolved.

```js
import { some } from 'promise-utils'

const [ first, seconds ] = await some([
  ping('ns1.example.org'),
  ping('ns2.example.org'),
  ping('ns3.example.org'),
  ping('ns4.example.org')
], 2)
```

#### timeout(promise, ms)

> Automatically rejects a promise if it is still pending after `ms`
> milliseconds.

```js
await timeout(doLongOperation(), 100)

// ES2016 syntax.
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

- report any [issue](https://github.com/julien-f/js-promise-utils/issues)
  you've encountered;
- fork and create a pull request.

## License

ISC © [Julien Fontanet](https://github.com/julien-f)
