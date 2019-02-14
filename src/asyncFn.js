const toPromise = require("./_resolve");

function step(key, value) {
  let cursor;
  try {
    cursor = this.iterator[key](value);
  } catch (error) {
    return this.reject(error);
  }
  value = cursor.value;
  if (cursor.done) {
    this.resolve(value);
  } else {
    this.toPromise(value).then(this.onFulfill, this.onReject);
  }
}

function AsyncFn(iterator, resolve, reject) {
  this.iterator = iterator;
  this.onFulfill = step.bind(this, "next");
  this.onReject = step.bind(this, "throw");
  this.reject = reject;
  this.resolve = resolve;
  this.toPromise = toPromise;
}

const asyncFn = generator =>
  function() {
    return new Promise((resolve, reject) =>
      new AsyncFn(generator.apply(this, arguments), resolve, reject).onFulfill()
    );
  };
asyncFn.cancelable = generator =>
  function(cancelToken) {
    if (cancelToken.requested) {
      return Promise.reject(cancelToken.reason);
    }
    return new Promise((resolve, reject) => {
      const o = new AsyncFn(generator.apply(this, arguments), resolve, reject);
      const cancelPromise = cancelToken.promise;
      cancelPromise.then(() => {
        o.toPromise = toPromise;
      });

      // TODO: add cancel handler to rest of the function
      o.toPromise = promise =>
        new Promise((resolve, reject) => {
          toPromise(promise).then(resolve, reject);
          cancelPromise.then(reject);
        });
      o.onFulfill();
    });
  };
module.exports = asyncFn;

// TODO: asyncFn.timeout?
