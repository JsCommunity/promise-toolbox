/* eslint-env jest */

const wrapApply = require("./wrapApply");
const wrapCall = require("./wrapCall");
const { throwArg } = require("./fixtures");

describe("wrapApply() & wrapCall()", () => {
  it("calls a function passing args and thisArg", () => {
    const args = ["foo", "bar", "baz"];
    const thisArg = {};
    const spy = jest.fn();

    wrapApply(spy, args, thisArg);
    wrapCall(spy, args, thisArg);

    expect(spy.mock.calls).toEqual([args, [args]]);
    expect(spy.mock.instances[0]).toBe(thisArg);
    expect(spy.mock.instances[1]).toBe(thisArg);
  });

  it("forwards any returned promise", () => {
    const p = Promise.resolve();
    const fn = () => p;

    expect(wrapApply(fn)).toBe(p);
    expect(wrapCall(fn)).toBe(p);
  });

  it("wraps sync returned value", () => {
    const value = {};
    const fn = () => value;

    return Promise.all([
      wrapApply(fn).then(result => {
        expect(result).toBe(value);
      }),
      wrapCall(fn).then(result => {
        expect(result).toBe(value);
      }),
    ]);
  });

  it("wraps sync exceptions", () => {
    const value = {};
    const fn = () => throwArg(value);

    return Promise.all([
      expect(wrapApply(fn)).rejects.toBe(value),
      expect(wrapCall(fn)).rejects.toBe(value),
    ]);
  });
});
