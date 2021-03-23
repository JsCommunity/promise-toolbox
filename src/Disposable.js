const evalDisposable = require("./_evalDisposable");
const isDisposable = require("./_isDisposable");
const pFinally = require("./_finally");
const setFunctionNameAndLength = require("./_setFunctionNameAndLength");
const wrapApply = require("./wrapApply");
const wrapCall = require("./wrapCall");

function Disposable(value, dispose) {
  if (typeof dispose !== "function") {
    throw new Error("dispose must be a function");
  }

  this.dispose = dispose;
  this.value = value;
}
module.exports = Disposable;

Disposable.all = function all(iterable) {
  let disposers = [];
  const dispose = () => {
    const d = disposers;
    disposers = undefined;
    d.forEach(disposer => disposer());
  };
  const onFulfill = maybeDisposable => {
    if (disposers === undefined) {
      return isDisposable(maybeDisposable) && maybeDisposable.dispose();
    }

    if (isDisposable(maybeDisposable)) {
      disposers.push(maybeDisposable.dispose);
      return maybeDisposable.value;
    }
    return maybeDisposable;
  };
  const onReject = error => {
    if (disposers === undefined) {
      return;
    }

    dispose();
    throw error;
  };
  return Promise.all(
    Array.from(iterable, maybeDisposable =>
      evalDisposable(maybeDisposable).then(onFulfill, onReject)
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

      const onEvalDisposable = value =>
        isDisposable(value) ? loop(stack.enter(value)) : value;
      const onFulfill = ({ value }) =>
        evalDisposable(value).then(onEvalDisposable);
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

const onHandlerFulfill = result => {
  if (result == null || typeof result.next !== "function") {
    return result;
  }

  const { dispose, value: stack } = new ExitStack();

  const onEvalDisposable = disposable => loop(stack.enter(disposable));
  const onFulfill = cursor =>
    cursor.done
      ? cursor.value
      : evalDisposable(cursor.value).then(onEvalDisposable);
  const loop = value => wrapCall(result.next, value, result).then(onFulfill);

  return pFinally(loop(), dispose);
};

// Usage:
//    Disposable.use(maybeDisposable…, handler)
//    Disposable.use(maybeDisposable[], handler)
Disposable.use = function use() {
  let nDisposables = arguments.length - 1;

  if (nDisposables < 0) {
    throw new TypeError("Disposable.use expects at least 1 argument");
  }

  const handler = arguments[nDisposables];

  let disposables;
  const spread =
    nDisposables > 1 || !Array.isArray((disposables = arguments[0]));
  if (spread) {
    disposables = Array.prototype.slice.call(arguments, 0, nDisposables);
  } else {
    nDisposables = disposables.length;
  }

  return Disposable.all(disposables).then(({ dispose, value }) =>
    pFinally(
      (spread ? wrapApply : wrapCall)(handler, value, this).then(
        onHandlerFulfill
      ),
      dispose
    )
  );
};
