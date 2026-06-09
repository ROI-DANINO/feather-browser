import { describe, it, expect, vi } from "vitest";
import { errors } from "playwright";
import {
  withActionErrors,
  ElementNotFoundError,
  ElementNotActionableError,
  WaitTimeoutError,
} from "../../../src/commands/input-errors";

describe("withActionErrors", () => {
  it("passes through the result on success without calling the probe", async () => {
    const probe = vi.fn().mockResolvedValue(0);
    await expect(withActionErrors(probe, "click", async () => "ok")).resolves.toBe("ok");
    expect(probe).not.toHaveBeenCalled();
  });

  it("maps TimeoutError + 0 matches to ElementNotFoundError (code ELEMENT_NOT_FOUND)", async () => {
    const run = withActionErrors(() => Promise.resolve(0), "click", async () => {
      throw new errors.TimeoutError("timeout");
    });
    await expect(run).rejects.toBeInstanceOf(ElementNotFoundError);
    await expect(run.catch((e) => e.code)).resolves.toBe("ELEMENT_NOT_FOUND");
  });

  it("maps TimeoutError + >0 matches to ElementNotActionableError (code ELEMENT_NOT_ACTIONABLE)", async () => {
    const run = withActionErrors(() => Promise.resolve(1), "click", async () => {
      throw new errors.TimeoutError("timeout");
    });
    await expect(run).rejects.toBeInstanceOf(ElementNotActionableError);
    await expect(run.catch((e) => e.code)).resolves.toBe("ELEMENT_NOT_ACTIONABLE");
  });

  it("rethrows non-timeout errors unchanged", async () => {
    await expect(
      withActionErrors(() => Promise.resolve(0), "click", async () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
  });
});

describe("error classes", () => {
  it("WaitTimeoutError carries code WAIT_TIMEOUT", () => {
    const e = new WaitTimeoutError("x");
    expect(e.code).toBe("WAIT_TIMEOUT");
    expect(e.name).toBe("WaitTimeoutError");
  });
});
