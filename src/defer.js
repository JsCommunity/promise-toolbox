// Discouraged but sometimes necessary way to create a promise.
const defer = () => {
  let resolve, reject;
  // eslint-disable-next-line promise/param-names
  const promise = new Promise((resolve_, reject_) => {
    resolve = resolve_;
    reject = reject_;
  });

  return {
    promise,
    reject,
    resolve,
  };
};
module.exports = defer;
