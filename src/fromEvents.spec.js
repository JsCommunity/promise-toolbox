/* eslint-env jest */

const { EventEmitter } = require("events");

const fromEvents = require("./fromEvents");

const arg1 = "arg1";
const arg2 = "arg2";
const emitter = new EventEmitter();

describe("fromEvents()", () => {
  it("resolves if one of the success events is emitted", () => {
    const promise = fromEvents(emitter, ["foo", "bar"]);
    emitter.emit("foo", arg1, arg2);

    return promise.then(event => {
      expect(event.name).toBe("foo");
      expect(event.args.slice()).toEqual([arg1, arg2]);

      // legacy API
      expect(event.event).toBe("foo");
      expect(event.slice()).toEqual([arg1, arg2]);
    });
  });

  // -----------------------------------------------------------------

  it("rejects if one of the error events is emitted", () => {
    const promise = fromEvents(emitter, [], ["foo", "bar"]);
    emitter.emit("bar", arg1);

    return promise.catch(event => {
      expect(event.name).toBe("bar");
      expect(event.args.slice()).toEqual([arg1]);

      // legacy API
      expect(event.event).toBe("bar");
      expect(event.slice()).toEqual([arg1]);
    });
  });
});
