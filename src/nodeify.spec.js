/* eslint-env jest */

const nodeify = require("./nodeify");

describe("nodeify()", () => {
  it("handles resolved promises", (done) => {
    nodeify(() => Promise.resolve("foo"))((err, res) => {
      expect(err).toBe(undefined);
      expect(res).toBe("foo");
      done();
    });
  });

  it("handles rejected promises", (done) => {
    const err = new Error();
    nodeify(() => Promise.reject(err))((err, res) => {
      expect(err).toBe(err);
      expect(res).toBe(undefined);
      done();
    });
  });

  it("handles sync calls values", (done) => {
    nodeify(() => "foo")((err, res) => {
      expect(err).toBe(undefined);
      expect(res).toBe("foo");
      done();
    });
  });

  it("handles thrown errors", (done) => {
    const error = new Error();
    nodeify(() => {
      throw error;
    })((err, res) => {
      expect(err).toBe(err);
      expect(res).toBe(undefined);
      done();
    });
  });

  it("returns a function with the same name", () => {
    function foo() {}
    expect(nodeify(foo).name).toBe(foo.name);
  });

  it("returns a function with one more param", () => {
    expect(nodeify(function (a, b) {}).length).toBe(3);
  });
});
