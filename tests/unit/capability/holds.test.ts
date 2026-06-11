import { describe, it, expect, vi } from "vitest";
import { SessionHoldRegistry } from "../../../src/capability/holds";

describe("SessionHoldRegistry", () => {
  it("creates a hold with a unique id and the requested reason", () => {
    const reg = new SessionHoldRegistry();
    const a = reg.createHold("ses_1", "mfa");
    const b = reg.createHold("ses_1", "cdp-attach");
    expect(a.id).not.toEqual(b.id);
    expect(a.sessionId).toBe("ses_1");
    expect(a.reason).toBe("mfa");
    expect(typeof a.createdAt).toBe("string");
  });

  it("observe/has/count reflect active holds, scoped per session and reason", () => {
    const reg = new SessionHoldRegistry();
    reg.createHold("ses_1", "mfa");
    reg.createHold("ses_1", "mfa");
    reg.createHold("ses_1", "cdp-attach");
    reg.createHold("ses_2", "mfa");

    expect(reg.count("ses_1")).toBe(3);
    expect(reg.count("ses_1", "mfa")).toBe(2);
    expect(reg.count("ses_2")).toBe(1);
    expect(reg.has("ses_1", "cdp-attach")).toBe(true);
    expect(reg.has("ses_2", "cdp-attach")).toBe(false);
    expect(reg.observe("ses_1", "mfa")).toHaveLength(2);
    expect(reg.observe("ses_1")).toHaveLength(3);
  });

  it("observe returns holds oldest-first", () => {
    const reg = new SessionHoldRegistry();
    const first = reg.createHold("ses_1", "mfa");
    const second = reg.createHold("ses_1", "cdp-attach");
    expect(reg.observe("ses_1").map((h) => h.id)).toEqual([first.id, second.id]);
  });

  it("release runs the teardown once and drops the hold", async () => {
    const reg = new SessionHoldRegistry();
    const teardown = vi.fn();
    const h = reg.createHold("ses_1", "cdp-attach", teardown);

    await reg.release(h);

    expect(teardown).toHaveBeenCalledTimes(1);
    expect(reg.has("ses_1")).toBe(false);
    expect(reg.count("ses_1")).toBe(0);
  });

  it("release is idempotent — a second release (or by id) is a no-op", async () => {
    const reg = new SessionHoldRegistry();
    const teardown = vi.fn();
    const h = reg.createHold("ses_1", "cdp-attach", teardown);

    await reg.release(h);
    await reg.release(h);
    await reg.release(h.id);

    expect(teardown).toHaveBeenCalledTimes(1);
  });

  it("release of an unknown id is a no-op", async () => {
    const reg = new SessionHoldRegistry();
    await expect(reg.release("hold_does_not_exist")).resolves.toBeUndefined();
  });

  it("awaits an async teardown before resolving", async () => {
    const reg = new SessionHoldRegistry();
    let tornDown = false;
    const h = reg.createHold("ses_1", "cdp-attach", async () => {
      await new Promise((r) => setTimeout(r, 5));
      tornDown = true;
    });

    await reg.release(h);
    expect(tornDown).toBe(true);
  });

  it("releaseAllForSession tears down every hold for that session only", async () => {
    const reg = new SessionHoldRegistry();
    const t1 = vi.fn();
    const t2 = vi.fn();
    const tOther = vi.fn();
    reg.createHold("ses_1", "mfa", t1);
    reg.createHold("ses_1", "cdp-attach", t2);
    reg.createHold("ses_2", "mfa", tOther);

    await reg.releaseAllForSession("ses_1");

    expect(t1).toHaveBeenCalledTimes(1);
    expect(t2).toHaveBeenCalledTimes(1);
    expect(tOther).not.toHaveBeenCalled();
    expect(reg.count("ses_1")).toBe(0);
    expect(reg.count("ses_2")).toBe(1);
  });

  it("releaseAllForSession can target a single reason", async () => {
    const reg = new SessionHoldRegistry();
    const mfaTeardown = vi.fn();
    const cdpTeardown = vi.fn();
    reg.createHold("ses_1", "mfa", mfaTeardown);
    reg.createHold("ses_1", "cdp-attach", cdpTeardown);

    await reg.releaseAllForSession("ses_1", "mfa");

    expect(mfaTeardown).toHaveBeenCalledTimes(1);
    expect(cdpTeardown).not.toHaveBeenCalled();
    expect(reg.has("ses_1", "cdp-attach")).toBe(true);
  });

  it("a throwing teardown is reported, not propagated, and doesn't block the rest", async () => {
    const onTeardownError = vi.fn();
    const reg = new SessionHoldRegistry({ onTeardownError });
    const survivor = vi.fn();
    reg.createHold("ses_1", "cdp-attach", () => {
      throw new Error("socket close failed");
    });
    reg.createHold("ses_1", "mfa", survivor);

    await expect(reg.releaseAllForSession("ses_1")).resolves.toBeUndefined();

    expect(onTeardownError).toHaveBeenCalledTimes(1);
    const [error, hold] = onTeardownError.mock.calls[0];
    expect(error).toBeInstanceOf(Error);
    expect(hold.reason).toBe("cdp-attach");
    expect(survivor).toHaveBeenCalledTimes(1);
    expect(reg.count("ses_1")).toBe(0);
  });

  it("a rejecting async teardown is reported, not propagated", async () => {
    const onTeardownError = vi.fn();
    const reg = new SessionHoldRegistry({ onTeardownError });
    const h = reg.createHold("ses_1", "cdp-attach", async () => {
      throw new Error("async close failed");
    });

    await expect(reg.release(h)).resolves.toBeUndefined();
    expect(onTeardownError).toHaveBeenCalledTimes(1);
  });
});
