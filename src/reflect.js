const FN_FALSE = () => false;
const FN_TRUE = () => true;

const onFulfilled = (__proto__ => value => ({
  __proto__: __proto__,
  value: () => value,
}))({
  isFulfilled: FN_TRUE,
  isPending: FN_FALSE,
  isRejected: FN_FALSE,
  reason: () => {
    throw new Error("no reason, the promise has resolved");
  },
});

const onRejected = (__proto__ => reason => ({
  __proto__: __proto__,
  reason: () => reason,
}))({
  isFulfilled: FN_FALSE,
  isPending: FN_FALSE,
  isRejected: FN_TRUE,
  value: () => {
    throw new Error("no value, the promise has rejected");
  },
});

// Returns a promise that is always successful when this promise is
// settled. Its fulfillment value is an object that implements the
// PromiseInspection interface and reflects the resolution this
// promise.
module.exports = function(promise) {
  return promise.then(onFulfilled, onRejected);
};
