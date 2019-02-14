/* eslint-env jest */

const promisifyAll = require("./promisifyAll");

describe("promisifyAll()", () => {
  it("returns a new object", () => {
    const o = {};
    const r = promisifyAll(o);

    expect(typeof r).toBe("object");
    expect(r).not.toBe(o);
  });

  it("creates promisified version of all functions bound to the original object", async () => {
    const o = {
      foo(cb) {
        cb(undefined, this);
      },
    };
    const r = promisifyAll(o);

    expect(await r.foo()).toBe(o);
  });

  it("ignores functions ending with Sync or Async", () => {
    const o = {
      fooAsync() {},
      fooSync() {},
    };
    const r = o::promisifyAll();

    expect(r.foo).not.toBeDefined();
    expect(r.fooASync).not.toBeDefined();
    expect(r.fooSync).not.toBeDefined();
  });
});
