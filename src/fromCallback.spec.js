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
});
