/* eslint-env jest */

const retry = require("./retry");
const { forOwn } = require("./_utils");

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

  it("does not retry if `stop` callback is called", async () => {
    const e = new Error();
    let i = 0;
    await expect(
      retry(stop => {
        ++i;
        stop(e);
      })
    ).rejects.toBe(e);
    expect(i).toBe(1);
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
              { when, tries: 2 }
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
              { when, tries: 2 }
            ).catch(Function.prototype);
            expect(i).toBe(1);
          });
        })
    );
  });
});
