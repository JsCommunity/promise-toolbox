/* eslint-env jest */

const settle = require("./settle");
const { reject } = require("./fixtures");

describe("settle()", () => {
  it("works with arrays", () => {
    return [Promise.resolve(42), Math.PI, reject("fatality")]
      ::settle()
      .then(([status1, status2, status3]) => {
        expect(status1.isFulfilled()).toBe(true);
        expect(status2.isFulfilled()).toBe(true);
        expect(status3.isFulfilled()).toBe(false);

        expect(status1.isRejected()).toBe(false);
        expect(status2.isRejected()).toBe(false);
        expect(status3.isRejected()).toBe(true);

        expect(status1.value()).toBe(42);
        expect(status2.value()).toBe(Math.PI);
        expect(::status3.value).toThrow();

        expect(::status1.reason).toThrow();
        expect(::status2.reason).toThrow();
        expect(status3.reason()).toBe("fatality");
      });
  });

  it("works with objects", () => {
    return {
      a: Promise.resolve(42),
      b: Math.PI,
      c: reject("fatality"),
    }
      ::settle()
      .then(({ a: status1, b: status2, c: status3 }) => {
        expect(status1.isFulfilled()).toBe(true);
        expect(status2.isFulfilled()).toBe(true);
        expect(status3.isFulfilled()).toBe(false);

        expect(status1.isRejected()).toBe(false);
        expect(status2.isRejected()).toBe(false);
        expect(status3.isRejected()).toBe(true);

        expect(status1.value()).toBe(42);
        expect(status2.value()).toBe(Math.PI);
        expect(::status3.value).toThrow();

        expect(::status1.reason).toThrow();
        expect(::status2.reason).toThrow();
        expect(status3.reason()).toBe("fatality");
      });
  });
});
