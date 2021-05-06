/* eslint-env jest */

const promisify = require("./promisify");

describe("promisify()", () => {
  it("handle callback results", async () => {
    const value = {};
    expect(
      await promisify(function (cb) {
        cb(null, value);
      })()
    ).toBe(value);
  });

  it("resolves if `error` is `false`", async () => {
    const value = {};
    expect(
      await promisify((cb) => {
        // eslint-disable-next-line node/no-callback-literal
        cb(false, value);
      })()
    ).toBe(value);
  });

  it("handle callback errors", async () => {
    const error = new Error();
    await expect(
      promisify(function (cb) {
        cb(error);
      })()
    ).rejects.toThrowError(error);
  });

  it("handle thrown values", async () => {
    const error = new Error();
    await expect(
      promisify(function () {
        throw error;
      })()
    ).rejects.toThrowError(error);
  });

  it("forwards context and arguments", () => {
    const thisArg = {};
    const args = [{}, {}];
    promisify(function () {
      expect(this).toBe(thisArg);
      expect([].slice.call(arguments, 0, -1)).toEqual(args);
    }).apply(thisArg, args);
  });

  it("returns a function with the same name", () => {
    function foo() {}
    expect(promisify(foo).name).toBe(foo.name);
  });

  it("returns a function with one less param", () => {
    expect(promisify(function (a, b) {}).length).toBe(1);

    // special case if fn has no param
    expect(promisify(function () {}).length).toBe(0);
  });
});
