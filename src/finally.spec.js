/* eslint-env jest */

const lastly = require("./finally");

describe("finally()", () => {
  it("calls a callback on resolution", async () => {
    const value = {};
    const spy = jest.fn();

    expect(await Promise.resolve(value)::lastly(spy)).toBe(value);

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("calls a callback on rejection", async () => {
    const reason = {};
    const spy = jest.fn();

    await expect(Promise.reject(reason)::lastly(spy)).rejects.toBe(reason);

    expect(spy).toHaveBeenCalledTimes(1);
  });
});
