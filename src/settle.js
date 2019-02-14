const all = require("./all");
const reflect = require("./reflect");
const resolve = require("./_resolve");

// Given a collection (array or object) which contains promises,
// return a promise that is fulfilled when all the items in the
// collection are either fulfilled or rejected.
//
// This promise will be fulfilled with a collection (of the same type,
// array or object) containing promise inspections.
//
// Usage: collection::settle()
module.exports = function settle() {
  return this::all(value => resolve(value)::reflect());
};
