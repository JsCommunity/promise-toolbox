// Usage: pFinally(promise, cb)
const pFinally = (p, cb) => p.then(cb, cb).then(() => p);
module.exports = pFinally;
