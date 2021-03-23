/* eslint-env jest */

const noop = require("./_noop");
const tap = require("./tap");
const { reject } = require("./fixtures");

describe("tap(cb)", () => {
  it("call cb with the resolved value", () =>
    new Promise(resolve => {
      tap(Promise.resolve("value"), value => {
        expect(value).toBe("value");
        resolve();
      });
    }));

  it("does not call cb if the promise is rejected", async () => {
    await expect(
      tap(reject("reason"), () => reject("other reason"))
    ).rejects.toBe("reason");
  });

  it("forwards the resolved value", async () => {
    expect(await tap(Promise.resolve("value"), () => "other value")).toBe(
      "value"
    );
  });

  it("rejects if cb rejects", async () => {
    await expect(
      tap(Promise.resolve("value"), () => reject("reason"))
    ).rejects.toBe("reason");
  });
});

describe("tap(undefined, cb)", () => {
  it("call cb with the rejected reason", () =>
    new Promise(resolve => {
      tap(reject("reason"), undefined, reason => {
        expect(reason).toBe("reason");
        resolve();
      }).catch(noop); // prevents the unhandled rejection warning
    }));

  it("does not call cb if the promise is resolved", async () => {
    expect(
      await tap(Promise.resolve("value"), undefined, () =>
        reject("other reason")
      )
    ).toBe("value");
  });

  it("forwards the rejected reason", async () => {
    await expect(tap(reject("reason"), undefined, () => "value")).rejects.toBe(
      "reason"
    );
  });

  it("rejects if cb rejects", async () => {
    await expect(
      tap(reject("reason"), undefined, () => reject("other reason"))
    ).rejects.toBe("other reason");
  });
});
