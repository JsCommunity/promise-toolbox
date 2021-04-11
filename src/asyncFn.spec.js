/* eslint-env jest */

const asyncFn = require("./asyncFn");
const CancelToken = require("./CancelToken");

describe("asyncFn", () => {
  it("forwards this and args", async () => {
    const thisArg = {};
    const args = ["foo", "bar"];
    const f = asyncFn(function*() {
      expect(this).toBe(thisArg);
      expect(Array.from(arguments)).toEqual(args);
      return (yield Promise.resolve(1)) + 2;
    });
    await f.apply(thisArg, args);
  });

  it("makes promise resolution available via yield", async () => {
    const f = asyncFn(function*() {
      return (yield Promise.resolve(1)) + 2;
    });
    expect(await f()).toBe(3);
  });

  it("makes promise rejection available via yield", async () => {
    const f = asyncFn(function*(value) {
      try {
        yield Promise.reject(value);
      } catch (error) {
        return error;
      }
    });
    expect(await f("foo")).toBe("foo");
  });
});

describe("asyncFn.cancelable", () => {
  it("works", async () => {
    const { cancel, token } = CancelToken.source();
    let canceled = false;

    const expectedThis = {};
    const expectedArgs = [token, Math.random(), Math.random()];
    const expectedResult = {};
    const fn = asyncFn.cancelable(function*() {
      expect(this).toBe(expectedThis);
      expect(Array.from(arguments)).toEqual(expectedArgs);

      {
        const expectedValue = {};
        expect(yield Promise.resolve(expectedValue)).toBe(expectedValue);
      }
      {
        const expectedError = {};
        try {
          yield Promise.reject(expectedError);
          throw new Error();
        } catch (error) {
          expect(error).toBe(expectedError);
        }
      }

      cancel().then(() => {
        canceled = true;
      });

      try {
        yield Promise.resolve({});
      } catch (error) {
        expect(error).toBe(token.reason);
      }

      {
        const expectedValue = {};
        expect(yield [Promise.resolve(expectedValue)]).toBe(expectedValue);
      }

      yield [new Promise(resolve => setImmediate(resolve))];
      expect(canceled).toBe(false);

      return expectedResult;
    });

    expect(await fn.apply(expectedThis, expectedArgs)).toBe(expectedResult);

    await new Promise(resolve => setImmediate(resolve));
    expect(canceled).toBe(true);
  });
});
