/* eslint-env jest */

const Cancel = require("./Cancel");
const CancelToken = require("./CancelToken");
const noop = require("./_noop");

describe("Cancel", () => {
  it("accept a message", () => {
    const cancel = new Cancel("foo");
    expect(cancel.message).toBe("foo");
  });

  it("#toString()", () => {
    const cancel = new Cancel("foo");
    expect(String(cancel)).toBe("Cancel: foo");
  });
});

// -------------------------------------------------------------------

describe("CancelToken", () => {
  describe(".from()", () => {
    it("returns arg if already a CancelToken", () => {
      expect(CancelToken.from(CancelToken.none)).toBe(CancelToken.none);
    });

    if ("AbortController" in global) {
      it("creates a CancelToken from an AbortSignal", () => {
        const controller = new global.AbortController();
        const token = CancelToken.from(controller.signal);

        expect(token).toBeInstanceOf(CancelToken);
        expect(token.requested).toBe(false);

        controller.abort();

        expect(token.requested).toBe(true);
      });
    }
  });

  describe(".isCancelToken()", () => {
    it("determines whether the passed value is a CancelToken", () => {
      expect(CancelToken.isCancelToken(null)).toBe(false);
      expect(CancelToken.isCancelToken({})).toBe(false);
      expect(CancelToken.isCancelToken(new CancelToken(noop))).toBe(true);
    });
  });

  describe(".source()", () => {
    it("creates a new token", () => {
      const { cancel, token } = CancelToken.source();

      expect(token.requested).toBe(false);
      cancel();
      expect(token.requested).toBe(true);
    });

    it("creates a token which resolves when the passed one does", () => {
      const { cancel, token } = CancelToken.source();
      const { token: fork } = CancelToken.source([token]);

      expect(fork.requested).toBe(false);
      cancel();
      expect(fork.requested).toBe(true);
    });

    it("creates a token which resolves when the cancel is called", () => {
      const { token } = CancelToken.source();
      const { cancel, token: fork } = CancelToken.source([token]);

      expect(fork.requested).toBe(false);
      cancel();
      expect(fork.requested).toBe(true);
    });
  });

  describe("#promise", () => {
    it("returns a promise resolving on cancel", async () => {
      const { cancel, token } = CancelToken.source();

      const { promise } = token;
      cancel("foo");

      const value = await promise;
      expect(value).toBeInstanceOf(Cancel);
      expect(value.message).toBe("foo");
    });
  });

  describe("#reason", () => {
    it("synchronously returns the cancelation reason", () => {
      const { cancel, token } = CancelToken.source();

      expect(token.reason).toBeUndefined();
      cancel("foo");
      expect(token.reason.message).toBe("foo");
    });
  });

  describe("#requested", () => {
    it("synchronously returns whether cancelation has been requested", () => {
      const { cancel, token } = CancelToken.source();

      expect(token.requested).toBe(false);
      cancel();
      expect(token.requested).toBe(true);
    });
  });

  describe("#throwIfRequested()", () => {
    it("synchronously throws if cancelation has been requested", () => {
      const { cancel, token } = CancelToken.source();

      token.throwIfRequested();
      cancel("foo");
      try {
        token.throwIfRequested();
        expect(false).toBe("should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(Cancel);
        expect(error.message).toBe("foo");
      }
    });
  });
});
