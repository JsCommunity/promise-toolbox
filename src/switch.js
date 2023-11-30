const onFulfilled = value => [null, value];
const onRejected = reason => [reason, null];

module.exports = p => p.then(onFulfilled, onRejected);
