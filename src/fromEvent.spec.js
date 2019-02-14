/* eslint-env jest */

const { EventEmitter } = require("events");

const fromEvent = require("./fromEvent");
const noop = require("./_noop");

const arg1 = "arg1";
const arg2 = "arg2";
const emitter = new EventEmitter();

describe("fromEvent()", () => {
  it("waits for an event", () => {
    const promise = fromEvent(emitter, "foo");

    emitter.emit("foo");

    return promise;
  });

  // -----------------------------------------------------------------

  it("forwards first event arg", () => {
    const promise = fromEvent(emitter, "foo");
    emitter.emit("foo", arg1, arg2);

    return promise.then(value => {
      expect(value).toBe(arg1);
    });
  });

  // -----------------------------------------------------------------

  describe("array option", () => {
    it("forwards all args as an array", () => {
      const promise = fromEvent(emitter, "foo", {
        array: true,
      });
      emitter.emit("foo", arg1, arg2);

      return promise.then(value => {
        expect(value.event).toBe("foo");
        expect(value.slice()).toEqual([arg1, arg2]);
      });
    });
  });

  // -----------------------------------------------------------------

  it("resolves if event is error event", () => {
    const promise = fromEvent(emitter, "error");
    emitter.emit("error");
    return promise;
  });

  // -----------------------------------------------------------------

  it("handles error event", () => {
    const error = new Error();

    const promise = fromEvent(emitter, "foo");
    emitter.emit("error", error);

    return expect(promise).rejects.toBe(error);
  });

  // -----------------------------------------------------------------

  describe("error option", () => {
    it("handles a custom error event", () => {
      const error = new Error();

      const promise = fromEvent(emitter, "foo", {
        error: "test-error",
      });
      emitter.emit("test-error", error);

      return expect(promise).rejects.toBe(error);
    });
  });

  // -----------------------------------------------------------------

  describe("ignoreErrors option", () => {
    it("ignores error events", () => {
      const error = new Error();

      // Node requires at least one error listener.
      emitter.once("error", noop);

      const promise = fromEvent(emitter, "foo", {
        ignoreErrors: true,
      });
      emitter.emit("error", error);
      emitter.emit("foo", arg1);

      return promise.then(value => {
        expect(value).toBe(arg1);
      });
    });
  });

  // -----------------------------------------------------------------

  it("removes listeners after event", () => {
    const promise = fromEvent(emitter, "foo");
    emitter.emit("foo");

    return promise.then(() => {
      expect(emitter.listeners("foo")).toEqual([]);
      expect(emitter.listeners("error")).toEqual([]);
    });
  });

  // -----------------------------------------------------------------

  it("removes listeners after error", () => {
    const promise = fromEvent(emitter, "foo");
    emitter.emit("error");

    return promise.catch(() => {
      expect(emitter.listeners("foo")).toEqual([]);
      expect(emitter.listeners("error")).toEqual([]);
    });
  });
});
