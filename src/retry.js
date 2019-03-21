const matchError = require("./_matchError");
const noop = require("./_noop");

function stopRetry(error) {
  this.error = error;
  // eslint-disable-next-line no-throw-literal
  throw this;
}

module.exports = function retry(
  fn,
  { delay = 1e3, onRetry = noop, retries, tries, when } = {}
) {
  if (tries === undefined) {
    tries = retries !== undefined ? retries + 1 : 10;
  } else if (retries !== undefined) {
    throw new TypeError("retries and tries options are mutually exclusive");
  }

  const container = { error: undefined };
  const stop = stopRetry.bind(container);

  let sleep;
  if (delay !== 0) {
    const resolver = resolve => setTimeout(resolve, delay);
    sleep = () => new Promise(resolver);
  }

  when = matchError.bind(undefined, when);

  const onError = error => {
    if (error === container) {
      throw container.error;
    }
    if (--tries === 0 || !when(error)) {
      throw error;
    }
    return Promise.resolve(onRetry(error))
      .then(sleep)
      .then(loop);
  };
  const resolver = resolve => resolve(fn(stop));
  const loop = () => new Promise(resolver).catch(onError);

  return loop();
};
