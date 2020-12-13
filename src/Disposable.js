const evalDisposable = require("./_evalDisposable");
const isDisposable = require("./_isDisposable");
const setFunctionNameAndLength = require("./_setFunctionNameAndLength");
const wrapCall = require("./wrapCall");

function Disposable(value, dispose) {
  if (typeof dispose !== "function") {
    throw new Error("dispose must be a function");
  }

  this.dispose = dispose;
  this.value = value;
}
module.exports = Disposable;

Disposable.all = function all(disposables) {
  let disposers = [];
  const dispose = () => {
    const d = disposers;
    disposers = undefined;
    d.forEach(disposer => disposer());
  };
  const onFulfill = disposable => {
    if (disposers === undefined) {
      return isDisposable(disposable) && disposable.dispose();
    }

    if (isDisposable(disposable)) {
      disposers.push(disposable.dispose);
      return disposable.value;
    }
    return disposable;
  };
  const onReject = error => {
    if (disposers === undefined) {
      return;
    }

    dispose();
    throw error;
  };
  return Promise.all(
    Array.from(disposables, disposable =>
      evalDisposable(disposable).then(onFulfill, onReject)
    )
  ).then(values => new Disposable(values, dispose));
};

// Requires this circular dependency as late as possible to avoid problems with jest
const ExitStack = require("./_ExitStack");

// inspired by
//
// - https://github.com/tc39/proposal-explicit-resource-management
// - https://book.pythontips.com/en/latest/context_managers.html
Disposable.factory = genFn =>
  setFunctionNameAndLength(
    function() {
      const gen = genFn.apply(this, arguments);

      const { dispose, value: stack } = new ExitStack();

      const onFulfill = ({ value }) =>
        isDisposable(value) ? stack.enter(value).then(loop) : value;
      const loop = value => wrapCall(gen.next, value, gen).then(onFulfill);

      return loop().then(
        value =>
          new Disposable(value, () =>
            wrapCall(gen.return, undefined, gen).then(dispose)
          ),
        error => {
          const forwardError = () => {
            throw error;
          };
          return dispose().then(forwardError, forwardError);
        }
      );
    },
    genFn.name,
    genFn.length
  );
