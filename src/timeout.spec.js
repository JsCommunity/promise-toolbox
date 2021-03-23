/* eslint-env jest */

const noop = require("./_noop");
const timeout = require("./timeout");
const TimeoutError = require("./TimeoutError");
const { reject } = require("./fixtures");

describe("timeout()", () => {
  const neverSettle = new Promise(noop);

  it("rejects a promise if not settled after a delay", async () => {
    await expect(timeout(neverSettle, 10)).rejects.toBeInstanceOf(TimeoutError);
  });

  it("call the callback if not settled after a delay", async () => {
    expect(await timeout(neverSettle, 10, () => "bar")).toBe("bar");
  });

  it("forwards the settlement if settled before a delay", async () => {
    expect(await timeout(Promise.resolve("value"), 10)).toBe("value");

    await expect(timeout(reject("reason"), 10)).rejects.toBe("reason");
  });

  it("rejects if cb throws synchronously", async () => {
    await expect(
      timeout(neverSettle, 10, () => {
        throw "reason"; // eslint-disable-line no-throw-literal
      })
    ).rejects.toBe("reason");
  });

  it("thrown error has correct stack trace", async () => {
    let error;
    try {
      error = new Error();
      await timeout(neverSettle, 10);
    } catch (timeoutError) {
      expect(timeoutError.stack.split("\n").slice(3, 10)).toEqual(
        error.stack.split("\n").slice(2, 9)
      );
    }
  });
});
