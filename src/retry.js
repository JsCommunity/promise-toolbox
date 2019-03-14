const matchError = require("./_matchError");
const noop = require("./_noop");

const pDelay = require("./delay");

function stopRetry(error) {
  this.error = error;
  // eslint-disable-next-line no-throw-literal
  throw this;
}

module.exports = async function retry(
  fn,
  { delay = 1e3, onRetry = noop, tries = 10, when } = {}
) {
  const container = { error: undefined };
  const stop = stopRetry.bind(container);

  when = matchError.bind(undefined, when);

  while (true) {
    try {
      return await fn(stop);
    } catch (error) {
      if (error === container) {
        throw container.error;
      }
      if (--tries === 0 || !when(error)) {
        throw error;
      }
      await onRetry(error);
    }
    await pDelay(delay);
  }
};
