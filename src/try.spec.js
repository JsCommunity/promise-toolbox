/* eslint-env jest */

const pTry = require("./try");
const { throwArg } = require("./fixtures");

describe("try()", () => {
  it("wraps returned value in promise", () => {
    return pTry(() => "foo").then((value) => {
      expect(value).toBe("foo");
    });
  });

  it("wraps thrown exception in promise", () => {
    return expect(pTry(() => throwArg("foo"))).rejects.toBe("foo");
  });

  it("calls the callback synchronously", () => {
    const spy = jest.fn();
    pTry(spy);

    expect(spy).toHaveBeenCalled();
  });
});
