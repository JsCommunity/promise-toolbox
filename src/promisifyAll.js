const promisify = require('./promisify')
const { endsWith, forIn } = require('./_utils')

const DEFAULT_MAPPER = (_, name) =>
  !(endsWith(name, 'Sync') || endsWith(name, 'Async')) && name

// Usage: promisifyAll(obj, [ opts ])
const promisifyAll = (
  obj,
  { mapper = DEFAULT_MAPPER, target = {}, context = obj } = {}
) => {
  forIn(obj, (value, name) => {
    let newName
    if (typeof value === 'function' && (newName = mapper(value, name, obj))) {
      target[newName] = promisify(value, context)
    }
  })

  return target
}
module.exports = promisifyAll
