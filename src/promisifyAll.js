const promisify = require("./promisify");
const { forIn } = require("./_utils");

const DEFAULT_MAPPER = (_, name) =>
  !(name.endsWith("Sync") || name.endsWith("Async")) && name;

// Usage: promisifyAll(obj, [ opts ])
const promisifyAll = (
  obj,
  { mapper = DEFAULT_MAPPER, target = {}, context = obj } = {}
) => {
  forIn(obj, (value, name) => {
    let newName;
    if (typeof value === "function" && (newName = mapper(value, name, obj))) {
      target[newName] = promisify(value, context);
    }
  });

  return target;
};
module.exports = promisifyAll;
