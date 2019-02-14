/* eslint-env jest */

const ignoreErrors = require("./ignoreErrors");
const { reject } = require("./fixtures");

describe("ignoreErrors()", () => {
  it("swallows errors", () => {
    return reject("foo")::ignoreErrors();
  });

  it("does not swallow programmer errors", async () => {
    expect(
      Promise.reject(new ReferenceError(""))::ignoreErrors()
    ).rejects.toBeInstanceOf(ReferenceError);
    expect(
      Promise.reject(new SyntaxError(""))::ignoreErrors()
    ).rejects.toBeInstanceOf(SyntaxError);
    expect(
      Promise.reject(new TypeError(""))::ignoreErrors()
    ).rejects.toBeInstanceOf(TypeError);
  });
});
