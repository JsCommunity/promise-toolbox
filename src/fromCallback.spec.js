/* eslint-env jest */

const fromCallback = require("./fromCallback");
const { hideLiteralErrorFromLinter } = require("./fixtures");

describe("fromCallback()", () => {
  it("creates a promise which resolves with value passed to the callback", async () => {
    expect(await fromCallback(cb => cb(undefined, "foo"))).toBe("foo");
  });

  it("creates a promise which rejects with reason passed to the callback", async () => {
    await expect(
      fromCallback(cb => cb(hideLiteralErrorFromLinter("bar")))
    ).rejects.toBe("bar");
  });

  it("passes context and arguments", async () => {
    const context = {};
    const args = ["bar", "baz"];

    expect(
      await fromCallback.call(
        context,
        function(...args_) {
          const cb = args_.pop();

          expect(this).toBe(context);
          expect(args_).toEqual(args);

          cb(null, "foo");
        },
        ...args
      )
    ).toBe("foo");
  });

  it("can call a method by its name", async () => {
    const obj = {
      method(cb) {
        expect(this).toBe(obj);
        cb(null, "foo");
      },
    };

    expect(await fromCallback.call(obj, "method")).toBe("foo");
  });
});
