import { describe, it, expect, vi } from "vitest";
import { errors } from "playwright";
import {
  withActionErrors,
  ElementNotFoundError,
  ElementNotActionableError,
} from "../../../src/commands/input-errors";

describe("withActionErrors", () => {
  it("passes through the result on success", async () => {
    const loc = { count: vi.fn() };
    await expect(withActionErrors(loc as any, "click", async () => "ok")).resolves.toBe("ok");
    expect(loc.count).not.toHaveBeenCalled();
  });

  it("maps TimeoutError + 0 matches to ElementNotFoundError (code ELEMENT_NOT_FOUND)", async () => {
    const loc = { count: vi.fn().mockResolvedValue(0) };
    const run = withActionErrors(loc as any, "click", async () => {
      throw new errors.TimeoutError("timeout");
    });
    await expect(run).rejects.toBeInstanceOf(ElementNotFoundError);
    await expect(run.catch((e) => e.code)).resolves.toBe("ELEMENT_NOT_FOUND");
  });

  it("maps TimeoutError + >0 matches to ElementNotActionableError (code ELEMENT_NOT_ACTIONABLE)", async () => {
    const loc = { count: vi.fn().mockResolvedValue(1) };
    const run = withActionErrors(loc as any, "click", async () => {
      throw new errors.TimeoutError("timeout");
    });
    await expect(run).rejects.toBeInstanceOf(ElementNotActionableError);
    await expect(run.catch((e) => e.code)).resolves.toBe("ELEMENT_NOT_ACTIONABLE");
  });

  it("rethrows non-timeout errors unchanged", async () => {
    const loc = { count: vi.fn() };
    await expect(
      withActionErrors(loc as any, "click", async () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
  });
});
