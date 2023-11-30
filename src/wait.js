const isPromise = require("./isPromise");
const { forEach } = require("./_utils");

const wait = (module.exports = promises =>
  new Promise(resolve => {
    let n = 0;
    const done = () => {
      if (--n === 0) {
        resolve();
      }
    };

    forEach(promises, p => {
      ++n;
      if (isPromise(p)) {
        p.then(done, done);
      }
    });

    if (n === 0) {
      resolve();
    }
  }));

const race = promises =>
  wait(promises, {
    some: 1,
  });

const all = promises => {
  const result = [];
  return wait(promises, {
    onFulfillment(value) {
      result.push(value);
    },
    onRejection(reason) {
      this.reject(reason);
    },
  }).then(() => result);
};

const any = promises =>
  wait(promises, {
    onFulfillment(value) {
      this.resolve(value);
    },
  });
