/* eslint-env jest */

const forEach = require("./forEach");

describe("forEach()", () => {
  it("iterates over an array of promises", async () => {
    const spy = jest.fn();

    const array = [Promise.resolve("foo"), Promise.resolve("bar"), "baz"];

    expect(await forEach(array, spy)).not.toBeDefined();
    expect(await spy.mock.calls).toEqual([
      ["foo", 0, array],
      ["bar", 1, array],
      ["baz", 2, array],
    ]);
  });
});
