/* eslint-env jest */

const pFinally = require("./finally");

describe("finally()", () => {
  it("calls a callback on resolution", async () => {
    const value = {};
    const spy = jest.fn();

    expect(await pFinally(Promise.resolve(value), spy)).toBe(value);

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("calls a callback on rejection", async () => {
    const reason = {};
    const spy = jest.fn();

    await expect(pFinally(Promise.reject(reason), spy)).rejects.toBe(reason);

    expect(spy).toHaveBeenCalledTimes(1);
  });
});
