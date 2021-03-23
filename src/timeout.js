const TimeoutError = require("./TimeoutError");

// Usage:
// - timeout(promise, ms)
// - timeout(promise, ms, rejectionValue)
// - timeout(promise, ms, cb)
//
// 0 is a special value that disable the timeout
module.exports = function timeout(promise, ms, onReject) {
  if (ms === 0) {
    return promise;
  }

  if (onReject === undefined) {
    onReject = new TimeoutError();
  }

  return new Promise((resolve, reject) => {
    let handle = setTimeout(() => {
      handle = undefined;

      if (typeof promise.cancel === "function") {
        promise.cancel();
      }

      if (typeof onReject === "function") {
        try {
          resolve(onReject());
        } catch (error) {
          reject(error);
        }
      } else {
        reject(onReject);
      }
    }, ms);

    promise.then(
      value => {
        handle !== undefined && clearTimeout(handle);
        resolve(value);
      },
      reason => {
        handle !== undefined && clearTimeout(handle);
        reject(reason);
      }
    );
  });
};
