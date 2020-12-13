const Disposable = require("./Disposable");
const ExitStack = require("./_ExitStack");
const pFinally = require("./_finally");
const wrapApply = require("./wrapApply");
const wrapCall = require("./wrapCall");

const onHandlerFulfill = result => {
  if (result == null || typeof result.next !== "function") {
    return result;
  }

  const { dispose, value: stack } = new ExitStack();

  const onFulfill = cursor =>
    cursor.done ? cursor.value : stack.enter(cursor.value).then(loop);
  const loop = value => wrapCall(result.next, value, result).then(onFulfill);

  return pFinally(loop(), dispose);
};

// Usage:
//    using(maybeDisposable…, handler)
//    using(maybeDisposable[], handler)
module.exports = function using() {
  let nDisposables = arguments.length - 1;

  if (nDisposables < 0) {
    throw new TypeError("using expects at least 1 arguments");
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
