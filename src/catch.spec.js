/* eslint-env jest */

const makeError = require("make-error");

const pCatch = require("./catch");
const identity = require("./_identity");
const { reject } = require("./fixtures");

describe("catch", () => {
  it("catches errors matching a predicate", async () => {
    const predicate = reason => reason === "foo";

    expect(await pCatch(reject("foo"), predicate, identity)).toBe("foo");

    await expect(pCatch(reject("bar"), predicate, identity)).rejects.toBe(
      "bar"
    );
  });

  it("catches errors matching a class", async () => {
    const CustomError1 = makeError("CustomError1");
    const CustomError2 = makeError("CustomError2");

    const error = new CustomError1();

    // The class itself.
    expect(await pCatch(Promise.reject(error), CustomError1, identity)).toBe(
      error
    );

    // A parent.
    expect(await pCatch(Promise.reject(error), Error, identity)).toBe(error);

    // Another class.
    await expect(
      pCatch(Promise.reject(error), CustomError2, identity)
    ).rejects.toBe(error);
  });

  it("catches errors matching an object pattern", async () => {
    const predicate = { foo: 0 };

    expect(await pCatch(reject({ foo: 0 }), predicate, identity)).toEqual({
      foo: 0,
    });

    await expect(
      pCatch(reject({ foo: 1 }), predicate, identity)
    ).rejects.toEqual({ foo: 1 });

    await expect(
      pCatch(reject({ bar: 0 }), predicate, identity)
    ).rejects.toEqual({ bar: 0 });
  });

  it("does not catch programmer errors", async () => {
    await expect(
      pCatch(Promise.reject(new ReferenceError("")), identity)
    ).rejects.toBeInstanceOf(ReferenceError);
    await expect(
      pCatch(Promise.reject(new SyntaxError("")), identity)
    ).rejects.toBeInstanceOf(SyntaxError);
    await expect(
      pCatch(Promise.reject(new TypeError("")), identity)
    ).rejects.toBeInstanceOf(TypeError);

    // Unless matches by a predicate.
    expect(
      await pCatch(Promise.reject(new TypeError("")), TypeError, identity)
    ).toBeInstanceOf(TypeError);
  });
});
