const once = require('./_once')
const Resource = require('./_Resource')
const wrapApply = require('./wrapApply')
const wrapCall = require('./wrapCall')
const { forArray, isArray } = require('./_utils')

// Usage: using(disposers…, handler)
module.exports = function using () {
  let nResources = arguments.length - 1

  if (nResources < 1) {
    throw new TypeError('using expects at least 2 arguments')
  }

  const handler = arguments[nResources]

  let resources = arguments[0]
  const spread = nResources > 1 || !isArray(resources)
  if (spread) {
    resources = new Array(nResources)
    for (let i = 0; i < nResources; ++i) {
      resources[i] = arguments[i]
    }
  } else {
    nResources = resources.length
  }

  const dispose = once((fn, value) => {
    let leftToProcess = nResources

    const onSettle = () => {
      if (--leftToProcess === 0) {
        fn(value)
      }
    }

    // like Bluebird, on failure to dispose a resource, throw an async error
    const onFailure = reason => {
      setTimeout(() => {
        throw reason
      }, 0)
    }

    forArray(resources, resource => {
      let d
      if (resource != null && typeof (d = resource.d) === 'function') {
        resource.p.then(
          value => wrapCall(d, value).then(onSettle, onFailure),
          onSettle
        )

        resource.p = resource.d = undefined
      } else {
        --leftToProcess
      }
    })
  })

  return new Promise((resolve, reject) => {
    const values = new Array(nResources)
    let leftToProcess = nResources

    let onProviderFailure_ = reason => {
      onProviderFailure_ = onProviderSettle
      onSettle = () => dispose(reject, reason)

      onProviderSettle()
    }
    const onProviderFailure = reason => onProviderFailure_(reason)

    const onProviderSettle = () => {
      if (--leftToProcess === 0) {
        onSettle()
      }
    }

    let onSettle = () =>
      (spread ? wrapApply : wrapCall)(handler, values, this).then(
        value => dispose(resolve, value),
        reason => dispose(reject, reason)
      )

    forArray(resources, (resource, i) => {
      const p = resource instanceof Resource ? resource.p : resource
      if (p === undefined) {
        onProviderFailure(
          new TypeError('resource has already been disposed of')
        )
        return
      }

      p.then(value => {
        values[i] = value

        onProviderSettle()
      }, onProviderFailure)
    })
  })
}
