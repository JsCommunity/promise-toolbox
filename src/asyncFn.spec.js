/* eslint-env jest */

const asyncFn = require("./asyncFn");

describe("asyncFn", () => {
  it("forwards this and args", async () => {
    const thisArg = {};
    const args = ["foo", "bar"];
    const f = asyncFn(function*() {
      expect(this).toBe(thisArg);
      expect(Array.from(arguments)).toEqual(args);
      return (yield Promise.resolve(1)) + 2;
    });
    await f.apply(thisArg, args);
  });

  it("makes promise resolution available via yield", async () => {
    const f = asyncFn(function*() {
      return (yield Promise.resolve(1)) + 2;
    });
    expect(await f()).toBe(3);
  });

  it("makes promise rejection available via yield", async () => {
    const f = asyncFn(function*(value) {
      try {
        yield Promise.reject(value);
      } catch (error) {
        return error;
      }
    });
    expect(await f("foo")).toBe("foo");
  });
});
