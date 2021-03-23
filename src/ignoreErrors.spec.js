/* eslint-env jest */

const ignoreErrors = require("./ignoreErrors");
const { reject } = require("./fixtures");

describe("ignoreErrors()", () => {
  it("swallows errors", () => {
    return ignoreErrors(reject("foo"));
  });

  it("does not swallow programmer errors", async () => {
    expect(
      ignoreErrors(Promise.reject(new ReferenceError("")))
    ).rejects.toBeInstanceOf(ReferenceError);
    expect(
      ignoreErrors(Promise.reject(new SyntaxError("")))
    ).rejects.toBeInstanceOf(SyntaxError);
    expect(
      ignoreErrors(Promise.reject(new TypeError("")))
    ).rejects.toBeInstanceOf(TypeError);
  });
});
