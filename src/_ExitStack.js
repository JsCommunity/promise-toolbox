const Disposable = require("./Disposable");
const isDisposable = require("./_isDisposable");
const resolve = require("./_resolve");

// Inspired by https://docs.python.org/3/library/contextlib.html#contextlib.ExitStack
module.exports = class ExitStack {
  constructor() {
    this._disposables = [];

    const dispose = () => {
      const disposable = this._disposables.pop();
      return disposable !== undefined
        ? resolve(disposable.dispose()).then(dispose)
        : Promise.resolve();
    };
    return new Disposable(this, dispose);
  }

  enter(disposable) {
    if (!isDisposable(disposable)) {
      throw new TypeError("not a disposable");
    }
    this._disposables.push(disposable);
    return disposable.value;
  }
};
