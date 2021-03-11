const matchError = require("./_matchError");
const noop = require("./_noop");

function stopRetry(error) {
  this.error = error;
  // eslint-disable-next-line no-throw-literal
  throw this;
}

module.exports = function retry(
  fn,
  { delay, delays, onRetry = noop, retries, tries, when } = {}
) {
  let shouldRetry;
  if (delays !== undefined) {
    if (delay !== undefined || tries !== undefined || retries !== undefined) {
      throw new TypeError(
        "delays is incompatible with delay, tries and retries"
      );
    }

    const iterator = delays[Symbol.iterator]();
    shouldRetry = () => {
      const { done, value } = iterator.next();
      if (done) {
        return false;
      }
      delay = value;
      return true;
    };
  } else {
    if (tries === undefined) {
      tries = retries !== undefined ? retries + 1 : 10;
    } else if (retries !== undefined) {
      throw new TypeError("retries and tries options are mutually exclusive");
    }

    if (delay === undefined) {
      delay = 1e3;
    }

    shouldRetry = () => --tries !== 0;
  }

  const container = { error: undefined };
  const stop = stopRetry.bind(container);

  when = matchError.bind(undefined, when);

  const sleepResolver = resolve => setTimeout(resolve, delay);
  const sleep = () => new Promise(sleepResolver);
  const onError = error => {
    if (error === container) {
      throw container.error;
    }
    if (when(error) && shouldRetry()) {
      let promise = Promise.resolve(onRetry(error));
      if (delay !== 0) {
        promise = promise.then(sleep);
      }
      return promise.then(loop);
    }
    throw error;
  };
  const loopResolver = resolve => resolve(fn(stop));
  const loop = () => new Promise(loopResolver).catch(onError);

  return loop();
};
