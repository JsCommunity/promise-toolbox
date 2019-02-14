/* eslint-env jest */

const noop = require("./_noop");
const unpromisify = require("./unpromisify");
const { reject } = require("./fixtures");

describe("unpromisify()", () => {
  it("forwards the result", done => {
    const fn = unpromisify.call(() => Promise.resolve("foo"));

    fn((error, result) => {
      expect(error).toBe(undefined);
      expect(result).toBe("foo");

      done();
    });
  });

  it("forwards the error", done => {
    const fn = unpromisify.call(() => reject("foo"));

    fn(error => {
      expect(error).toBe("foo");

      done();
    });
  });

  it("does not catch sync exceptions", () => {
    const fn = unpromisify.call(() => {
      throw new Error("foo");
    });
    expect(() => fn(noop)).toThrow("foo");
  });
});
