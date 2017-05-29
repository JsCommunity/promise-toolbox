export const hideLiteralErrorFromLinter = literal => literal
export const identity = value => value
export const noop = () => {}
export const reject = reason => Promise.reject(reason)
export const throwArg = value => { throw value }

// swap resolution/rejection of a promise to help test rejection
export const rejectionOf = promise => promise.then(throwArg, identity)
