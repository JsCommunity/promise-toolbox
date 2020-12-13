/* eslint-env jest */

const Disposable = require("./Disposable");
const using = require("./using");
const noop = require("./_noop");
const { reject } = require("./fixtures");

describe("using()", () => {
  it("called with flat params", async () => {
    const d1 = jest.fn();
    const r1 = Promise.resolve(new Disposable("r1", d1));
    const r2 = Promise.resolve("r2");
    const r3 = "r3";
    const handler = jest.fn(() => "handler");

    expect(await using(r1, r2, r3, handler)).toBe("handler");
    expect(handler.mock.calls).toEqual([["r1", "r2", "r3"]]);
    expect(d1).toHaveBeenCalledTimes(1);
  });

  it("called with array param", async () => {
    const d1 = jest.fn();
    const p1 = Promise.resolve(new Disposable("p1", d1));
    const p2 = Promise.resolve("p2");
    const handler = jest.fn(() => "handler");

    expect(await using([p1, p2], handler)).toBe("handler");
    expect(handler.mock.calls).toEqual([[["p1", "p2"]]]);
    expect(d1).toHaveBeenCalledTimes(1);
  });

  // not supported in the new API because we avoid mutating disposables
  it.skip("a resource can only be used once", async () => {
    const d1 = jest.fn();
    const p1 = Promise.resolve(new Disposable("p1", d1));
    const handler = jest.fn();

    await using(p1, handler);
    handler.mockClear();
    d1.mockClear();

    const d2 = jest.fn();
    const p2 = Promise.resolve(new Disposable("p2", d2));

    await expect(using(p1, p2, noop)).rejects.toBeInstanceOf(TypeError);
    expect(handler).not.toHaveBeenCalled();
    expect(d1).not.toHaveBeenCalled();
    expect(d2).toHaveBeenCalledTimes(1);
  });

  it("error in a provider", async () => {
    const d1 = jest.fn();
    const p1 = Promise.resolve(new Disposable("p1", d1));
    const d2 = jest.fn();
    const p2 = reject("p2");
    const p3 = Promise.resolve("p3");
    const handler = jest.fn();

    await expect(using(p1, p2, p3, handler)).rejects.toBe("p2");
    expect(handler).not.toHaveBeenCalled();
    expect(d1).toHaveBeenCalledTimes(1);
    expect(d2).not.toHaveBeenCalled();
  });

  it("error in handler", async () => {
    const d1 = jest.fn();
    const p1 = Promise.resolve(new Disposable("p1", d1));
    const d2 = jest.fn();
    const p2 = Promise.resolve(new Disposable("p2", d2));
    const p3 = Promise.resolve("p3");
    const handler = jest.fn(() => reject("handler"));

    await expect(using(p1, p2, p3, handler)).rejects.toBe("handler");
    expect(handler.mock.calls).toEqual([["p1", "p2", "p3"]]);
    expect(d1).toHaveBeenCalledTimes(1);
    expect(d2).toHaveBeenCalledTimes(1);
  });

  it.skip("error in a disposer", () => {});

  const d = v => new Disposable(Math.random(), jest.fn());
  it("accepts a generator", async () => {
    const d1 = d();
    const d2 = d();
    const d3 = d();
    const d4 = d();

    expect(
      await using(function*() {
        expect(yield d1).toBe(d1.value);
        expect(yield Promise.resolve(d2)).toBe(d2.value);
        expect(yield () => d3).toBe(d3.value);
        expect(yield () => Promise.resolve(d4)).toBe(d4.value);

        expect(d1.dispose).not.toHaveBeenCalled();
        expect(d2.dispose).not.toHaveBeenCalled();
        expect(d3.dispose).not.toHaveBeenCalled();
        expect(d4.dispose).not.toHaveBeenCalled();

        return "handler";
      })
    ).toBe("handler");

    expect(d1.dispose).toHaveBeenCalledTimes(1);
    expect(d2.dispose).toHaveBeenCalledTimes(1);
    expect(d3.dispose).toHaveBeenCalledTimes(1);
    expect(d4.dispose).toHaveBeenCalledTimes(1);
  });
});
