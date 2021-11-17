/* eslint-env jest */

const Disposable = require("./Disposable");
const { reject } = require("./fixtures");

const d = () => ({ dispose: jest.fn(), value: Math.random() });

describe("Disposable", () => {
  it("cannot be used after being disposed of", async () => {
    const { dispose, value } = d();
    const disposable = new Disposable(dispose, value);

    expect(disposable.value).toBe(value);
    expect(dispose).toHaveBeenCalledTimes(0);

    disposable.dispose();

    expect(dispose).toHaveBeenCalledTimes(1);

    expect(() => disposable.value).toThrow(
      "this disposable has already been disposed"
    );
    expect(() => disposable.dispose()).toThrow(
      "this disposable has already been disposed"
    );
  });

  describe(".all()", () => {
    it("combine multiple disposables", async () => {
      const d1 = d();
      const d2 = d();

      await Disposable.use(function* () {
        expect(yield Disposable.all([d1, d2])).toEqual([d1.value, d2.value]);
        expect(d1.dispose).not.toHaveBeenCalled();
        expect(d2.dispose).not.toHaveBeenCalled();
      });

      expect(d1.dispose).toHaveBeenCalledTimes(1);
      expect(d2.dispose).toHaveBeenCalledTimes(1);
    });
  });

  describe(".factory()", () => {
    it("creates a disposable factory from a generator function", async () => {
      let disposed = false;
      const value = {};

      const dep1 = d();
      const dep2 = d();
      const callArgs = [{}, {}];
      const callThis = {};
      const d1 = await Disposable.factory(function* (...args) {
        expect(args).toEqual(callArgs);
        expect(this).toBe(callThis);

        expect(yield dep1).toBe(dep1.value);
        expect(yield Promise.resolve(dep2)).toBe(dep2.value);
        try {
          yield value;
        } finally {
          // expect(dep2.dispose).not.toHaveBeenCalledTimes(1);
          expect(dep1.dispose).not.toHaveBeenCalledTimes(1);
          disposed = true;
        }
      }).apply(callThis, callArgs);

      await Disposable.use(function* () {
        expect(yield d1).toBe(value);
        expect(disposed).toBe(false);
      });
      expect(disposed).toBe(true);
    });

    it("supports returning the value if no dispose", async () => {
      const value = {};
      const d1 = await Disposable.factory(function* () {
        return value;
      })();
      await Disposable.use(function* () {
        expect(yield d1).toBe(value);
      });
    });
  });
  describe(".use()", () => {
    it("called with flat params", async () => {
      const d1 = d();
      const r1 = Promise.resolve(d1);
      const r2 = Promise.resolve("r2");
      const r3 = "r3";
      const handler = jest.fn(() => "handler");

      expect(await Disposable.use(r1, r2, r3, handler)).toBe("handler");
      expect(handler.mock.calls).toEqual([[d1.value, "r2", "r3"]]);
      expect(d1.dispose).toHaveBeenCalledTimes(1);
    });

    it("called with array param", async () => {
      const d1 = d();
      const p1 = Promise.resolve(d1);
      const p2 = Promise.resolve("p2");
      const handler = jest.fn(() => "handler");

      expect(await Disposable.use([p1, p2], handler)).toBe("handler");
      expect(handler.mock.calls).toEqual([[[d1.value, "p2"]]]);
      expect(d1.dispose).toHaveBeenCalledTimes(1);
    });

    it("error in a provider", async () => {
      const d1 = d();
      const p1 = Promise.resolve(d1);
      const p2 = reject("p2");
      const p3 = Promise.resolve("p3");
      const handler = jest.fn();

      await expect(Disposable.use(p1, p2, p3, handler)).rejects.toBe("p2");
      expect(handler).not.toHaveBeenCalled();
      expect(d1.dispose).toHaveBeenCalledTimes(1);
    });

    it("error in handler", async () => {
      const d1 = d();
      const p1 = Promise.resolve(d1);
      const d2 = d();
      const p2 = Promise.resolve(d2);
      const p3 = Promise.resolve("p3");
      const handler = jest.fn(() => reject("handler"));

      await expect(Disposable.use(p1, p2, p3, handler)).rejects.toBe("handler");
      expect(handler.mock.calls).toEqual([[d1.value, d2.value, "p3"]]);
      expect(d1.dispose).toHaveBeenCalledTimes(1);
      expect(d2.dispose).toHaveBeenCalledTimes(1);
    });

    it.skip("error in a disposer", () => {});

    it("accepts a generator", async () => {
      const d1 = d();
      const d2 = d();
      const d3 = d();
      const d4 = d();

      expect(
        await Disposable.use(function* () {
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

    it("does not swallow a returned generator", async () => {
      const gen = (function* () {})();
      expect(await Disposable.use(d(), () => gen)).toBe(gen);
    });
  });

  describe(".wrap()", () => {
    it("creates a disposable user from a generator function", async () => {
      const d1 = d();

      const callArgs = [{}, {}];
      const callThis = {};

      const generator = function* foo(a, b) {
        expect(Array.from(arguments)).toEqual(callArgs);
        expect(this).toBe(callThis);

        expect(yield d1).toBe(d1.value);

        return "handler";
      };
      const wrapped = Disposable.wrap(generator);

      expect(wrapped.name).toBe(generator.name);
      expect(wrapped.length).toBe(generator.length);

      expect(await wrapped.apply(callThis, callArgs)).toBe("handler");
    });
  });
});
