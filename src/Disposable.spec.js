/* eslint-env jest */

const Disposable = require("./Disposable");
const using = require("./using");

const d = v => new Disposable(Math.random(), jest.fn());

describe("Disposable", () => {
  describe(".all()", () => {
    it("combine multiple disposables", async () => {
      const d1 = d();
      const d2 = d();

      await using(function*() {
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
      const d1 = await Disposable.factory(function*(...args) {
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

      await using(function*() {
        expect(yield d1).toBe(value);
        expect(disposed).toBe(false);
      });
      expect(disposed).toBe(true);
    });
  });
});
