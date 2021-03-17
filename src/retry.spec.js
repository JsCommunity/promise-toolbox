/* eslint-env jest */

const retry = require("./retry");
const { forOwn } = require("./_utils");

const microtasks = () => new Promise(setImmediate);

describe("retry()", () => {
  it("retries until the function succeeds", async () => {
    let i = 0;
    expect(
      await retry(
        () => {
          if (++i < 3) {
            throw new Error();
          }
          return "foo";
        },
        { delay: 0 }
      )
    ).toBe("foo");
    expect(i).toBe(3);
  });

  it("returns the last error", async () => {
    let tries = 5;
    const e = new Error();
    await expect(
      retry(
        () => {
          throw --tries > 0 ? new Error() : e;
        },
        { delay: 0, tries }
      )
    ).rejects.toBe(e);
  });
  [ReferenceError, TypeError].forEach(ErrorType => {
    it(`does not retry if a ${ErrorType.name} is thrown`, async () => {
      let i = 0;
      await expect(
        retry(() => {
          ++i;
          throw new ErrorType();
        })
      ).rejects.toBeInstanceOf(ErrorType);
      expect(i).toBe(1);
    });
  });

  it("does not retry if `retry.bail` callback is called", async () => {
    const e = new Error();
    let i = 0;
    await expect(
      retry(() => {
        ++i;
        retry.bail(e);
      })
    ).rejects.toBe(e);
    expect(i).toBe(1);
  });

  it("forwards this and arguments", async () => {
    expect.assertions(2);

    const expectedThis = {};
    const expectedArgs = [Math.random(), Math.random()];
    await retry.call(
      expectedThis,
      function(...args) {
        expect(this).toBe(expectedThis);
        expect(args).toEqual(expectedArgs);
      },
      { retries: 0 },
      ...expectedArgs
    );
  });

  describe("`delays` option", () => {
    it("works", async () => {
      jest.useFakeTimers();

      const expected = new Error();
      const fn = jest.fn(() => Promise.reject(expected));
      let actual;
      retry(fn, {
        delays: (function*() {
          yield 10;
          yield 20;
        })(),
      }).catch(error => {
        actual = error;
      });
      await microtasks();

      expect(fn).toHaveBeenCalledTimes(1);

      // ---

      jest.advanceTimersByTime(9);
      await microtasks();

      expect(fn).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(1);
      await microtasks();

      expect(fn).toHaveBeenCalledTimes(2);

      // ---

      jest.advanceTimersByTime(19);
      await microtasks();

      expect(fn).toHaveBeenCalledTimes(2);
      expect(actual).toBe(undefined);

      jest.advanceTimersByTime(1);
      await microtasks();

      expect(fn).toHaveBeenCalledTimes(3);
      expect(actual).toBe(expected);
    });
  });

  describe("`tries` and `retries` options", () => {
    it("are mutually exclusive", () => {
      expect(() =>
        retry(() => {}, {
          tries: 3,
          retries: 4,
        })
      ).toThrow(
        new RangeError("retries and tries options are mutually exclusive")
      );
    });
  });

  describe("`when` option", () => {
    forOwn(
      {
        "with function predicate": _ => _.message === "foo",
        "with object predicate": { message: "foo" },
      },
      (when, title) =>
        describe(title, () => {
          it("retries when error matches", async () => {
            let i = 0;
            await retry(
              () => {
                ++i;
                throw new Error("foo");
              },
              { delay: 0, when, tries: 2 }
            ).catch(Function.prototype);
            expect(i).toBe(2);
          });

          it("does not retry when error does not match", async () => {
            let i = 0;
            await retry(
              () => {
                ++i;
                throw new Error("bar");
              },
              { delay: 0, when, tries: 2 }
            ).catch(Function.prototype);
            expect(i).toBe(1);
          });
        })
    );
  });

  describe("`onRetry` option", () => {
    it("is called with the error before retry is scheduled", async () => {
      let error = new Error();
      expect(
        await retry(
          () => {
            if (error) {
              throw error;
            }
            return "foo";
          },
          {
            delay: 0,
            onRetry(e) {
              expect(e).toBe(error);
              error = null;
            },
          }
        )
      ).toBe("foo");
    });
  });

  describe(".wrap()", () => {
    it("creates a retrying function", async () => {
      const expectedThis = {};
      const expectedArgs = [Math.random(), Math.random()];
      const expectedResult = {};

      const fn = function foo(bar, baz) {
        expect(this).toBe(expectedThis);
        expect(Array.from(arguments)).toEqual(expectedArgs);

        return expectedResult;
      };
      const retryingFn = retry.wrap(fn, { retries: 0 });

      expect(retryingFn.name).toBe(fn.name);
      expect(retryingFn.length).toBe(fn.length);

      expect(await retryingFn.apply(expectedThis, expectedArgs)).toBe(
        expectedResult
      );
    });
  });
});
