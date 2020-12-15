const Disposable = require("./Disposable");
const isDisposable = require("./_isDisposable");
const pTry = require("./try");

// Inspired by https://docs.python.org/3/library/contextlib.html#contextlib.ExitStack
module.exports = class ExitStack {
  constructor() {
    this._disposers = [];

    const dispose = () => {
      const disposer = this._disposers.pop();
      return disposer !== undefined
        ? pTry(disposer).then(dispose)
        : Promise.resolve();
    };
    return new Disposable(this, dispose);
  }

  enter(disposable) {
    if (!isDisposable(disposable)) {
      throw new TypeError("not a disposable");
    }
    this._disposers.push(disposable.dispose);
    return disposable.value;
  }
};
