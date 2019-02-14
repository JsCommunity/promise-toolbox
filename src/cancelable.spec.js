/* eslint-env jest */

const cancelable = require("./cancelable");
const CancelToken = require("./CancelToken");
const noop = require("./_noop");

describe("@cancelable", () => {
  it("forwards params if a cancel token is passed", () => {
    const token = new CancelToken(noop);
    const spy = jest.fn(() => Promise.resolve());

    cancelable(spy)(token, "foo", "bar");
    expect(spy.mock.calls).toEqual([[token, "foo", "bar"]]);
  });

  it("injects a cancel token and add the cancel method on the returned promise if none is passed", () => {
    const spy = jest.fn(() => Promise.resolve());

    const promise = cancelable(spy)("foo", "bar");
    expect(spy.mock.calls).toEqual([
      [
        {
          asymmetricMatch: actual => CancelToken.isCancelToken(actual),
        },
        "foo",
        "bar",
      ],
    ]);
    const token = spy.mock.calls[0][0];
    expect(token.requested).toBe(false);
    promise.cancel();
    expect(token.requested).toBe(true);
  });
});
