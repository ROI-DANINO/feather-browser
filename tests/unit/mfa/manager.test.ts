import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { MfaChallengeManager, type PauseDeps } from "../../../src/mfa/manager";
import {
  MfaChallengeNotFoundError,
  MfaNotPendingError,
  MfaForbiddenError,
  MfaValidationError,
} from "../../../src/mfa/types";
import { SessionHoldRegistry } from "../../../src/capability/holds";

const ctx = { requestId: "req_test" };

function harness() {
  let pageUrl = "https://site.example/login";
  const page = { url: () => pageUrl };
  const session = { getPage: vi.fn().mockReturnValue({ pageId: "page_1", page }) };
  const sessions = { get: vi.fn().mockReturnValue(session) };
  const typeHandler = { execute: vi.fn().mockResolvedValue({ pageId: "page_1", typed: true }) } as any;
  const notifier = { notify: vi.fn().mockResolvedValue(undefined) };
  const logger = { log: vi.fn().mockResolvedValue(undefined) } as any;
  const holds = new SessionHoldRegistry();
  const pause: PauseDeps = {
    createPause: vi.fn().mockReturnValue({
      token: "pause_tok",
      resumePath: "/r",
      humanResumed: new Promise<void>(() => {}),
    }),
    resumePause: vi.fn().mockReturnValue(true),
    discardPause: vi.fn(),
  };
  const mgr = new MfaChallengeManager(sessions as any, typeHandler, notifier, logger, holds, 300000, pause);
  mgr.setBaseUrl("http://localhost:3333");
  return { mgr, sessions, typeHandler, notifier, logger, holds, pause, setPageUrl: (u: string) => (pageUrl = u) };
}

// Pull the single-use humanToken out of the URL the notifier was handed.
function tokenFromNotify(notifier: { notify: any }): string {
  const url = notifier.notify.mock.calls[0][1] as string;
  return new URL(url).searchParams.get("t")!;
}

describe("MfaChallengeManager.createChallenge", () => {
  let h: ReturnType<typeof harness>;
  beforeEach(() => { h = harness(); });

  it("creates a pending challenge, takes an mfa hold + pause, notifies with a humanToken url", async () => {
    const ch = await h.mgr.createChallenge({
      sessionId: "ses_1", type: "totp", target: { by: "css", selector: "#code" }, prompt: "LinkedIn 2FA",
    });
    expect(ch.status).toBe("pending");
    expect(ch.sessionId).toBe("ses_1");
    // hold + pause replace the deferred setStealthMode toggle
    expect(h.holds.has("ses_1", "mfa")).toBe(true);
    expect(h.holds.count("ses_1", "mfa")).toBe(1);
    expect(h.pause.createPause).toHaveBeenCalledWith("ses_1", "mfa", "page_1");
    // notifier got the human-facing url carrying a token; that token verifies
    const url = h.notifier.notify.mock.calls[0][1] as string;
    expect(url).toContain(`/v1/mfa/${ch.challengeId}`);
    expect(h.mgr.verifyHumanToken(ch.challengeId, tokenFromNotify(h.notifier))).toBe(true);
    expect(h.logger.log).toHaveBeenCalledWith(expect.objectContaining({ event: "mfa.challenge.created" }));
    expect(h.mgr.getChallenge(ch.challengeId)).toBe(ch);
  });

  it("does not leak the humanToken via the agent-facing localUrl or getChallenge", async () => {
    const ch = await h.mgr.createChallenge({ sessionId: "ses_1", type: "push", prompt: "Google" });
    expect(h.mgr.localUrlFor(ch.challengeId)).not.toContain("?t=");
    expect(JSON.stringify(h.mgr.getChallenge(ch.challengeId))).not.toContain(tokenFromNotify(h.notifier));
  });

  it("rejects a totp challenge with no target, and a push challenge with a target", async () => {
    await expect(h.mgr.createChallenge({ sessionId: "ses_1", type: "totp", prompt: "x" }))
      .rejects.toBeInstanceOf(MfaValidationError);
    await expect(h.mgr.createChallenge({
      sessionId: "ses_1", type: "push", target: { by: "css", selector: "#x" }, prompt: "x",
    })).rejects.toBeInstanceOf(MfaValidationError);
  });
});

describe("MfaChallengeManager.resolveChallenge", () => {
  let h: ReturnType<typeof harness>;
  beforeEach(() => { h = harness(); });

  it("types the code for totp, releases the hold + pause, returns resolved", async () => {
    const ch = await h.mgr.createChallenge({
      sessionId: "ses_1", type: "totp", target: { by: "css", selector: "#code" }, prompt: "x",
    });
    const token = tokenFromNotify(h.notifier);
    const resolved = await h.mgr.resolveChallenge(ch.challengeId, "123456", token, ctx);
    expect(h.typeHandler.execute).toHaveBeenCalledWith(
      { sessionId: "ses_1", pageId: "page_1", target: { by: "css", selector: "#code" }, text: "123456", mode: "sequential" },
      ctx,
    );
    expect(resolved.status).toBe("resolved");
    expect(resolved.resolvedAt).toBeDefined();
    expect(h.holds.has("ses_1", "mfa")).toBe(false); // hold released
    expect(h.pause.resumePause).toHaveBeenCalledWith("pause_tok", "ses_1");
    expect(h.logger.log).toHaveBeenCalledWith(expect.objectContaining({ event: "mfa.challenge.resolved" }));
  });

  it("does not type for push challenges", async () => {
    const ch = await h.mgr.createChallenge({ sessionId: "ses_1", type: "push", prompt: "Google" });
    const resolved = await h.mgr.resolveChallenge(ch.challengeId, undefined, tokenFromNotify(h.notifier), ctx);
    expect(h.typeHandler.execute).not.toHaveBeenCalled();
    expect(resolved.status).toBe("resolved");
  });

  it("rejects a wrong or missing humanToken (does not type, hold stays)", async () => {
    const ch = await h.mgr.createChallenge({
      sessionId: "ses_1", type: "totp", target: { by: "css", selector: "#code" }, prompt: "x",
    });
    await expect(h.mgr.resolveChallenge(ch.challengeId, "123456", "WRONG", ctx))
      .rejects.toBeInstanceOf(MfaForbiddenError);
    await expect(h.mgr.resolveChallenge(ch.challengeId, "123456", undefined, ctx))
      .rejects.toBeInstanceOf(MfaForbiddenError);
    expect(h.typeHandler.execute).not.toHaveBeenCalled();
    expect(h.holds.has("ses_1", "mfa")).toBe(true);
  });

  it("refuses to type when the page origin changed since creation (anti-phishing)", async () => {
    const ch = await h.mgr.createChallenge({
      sessionId: "ses_1", type: "totp", target: { by: "css", selector: "#code" }, prompt: "x",
    });
    const token = tokenFromNotify(h.notifier);
    h.setPageUrl("https://evil.example/phish");
    await expect(h.mgr.resolveChallenge(ch.challengeId, "123456", token, ctx))
      .rejects.toBeInstanceOf(MfaForbiddenError);
    expect(h.typeHandler.execute).not.toHaveBeenCalled();
  });

  it("throws MFA_NOT_FOUND for an unknown id and VALIDATION_ERROR for a totp resolve with no code", async () => {
    await expect(h.mgr.resolveChallenge("nope", "1", "t", ctx)).rejects.toBeInstanceOf(MfaChallengeNotFoundError);
    const ch = await h.mgr.createChallenge({
      sessionId: "ses_1", type: "totp", target: { by: "css", selector: "#code" }, prompt: "x",
    });
    const token = tokenFromNotify(h.notifier);
    await expect(h.mgr.resolveChallenge(ch.challengeId, undefined, token, ctx)).rejects.toBeInstanceOf(MfaValidationError);
  });

  it("throws MFA_NOT_PENDING when resolving twice", async () => {
    const ch = await h.mgr.createChallenge({ sessionId: "ses_1", type: "push", prompt: "x" });
    const token = tokenFromNotify(h.notifier);
    await h.mgr.resolveChallenge(ch.challengeId, undefined, token, ctx);
    await expect(h.mgr.resolveChallenge(ch.challengeId, undefined, token, ctx)).rejects.toBeInstanceOf(MfaNotPendingError);
  });
});

describe("MfaChallengeManager expiry + cancel", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("marks timed-out, releases the hold, discards the pause, logs expired", async () => {
    const h = harness();
    const mgr = new MfaChallengeManager(h.sessions as any, h.typeHandler, h.notifier, h.logger, h.holds, 1000, h.pause);
    mgr.setBaseUrl("http://localhost:3333");
    const ch = await mgr.createChallenge({ sessionId: "ses_1", type: "push", prompt: "x" });
    await vi.advanceTimersByTimeAsync(1001);
    expect(mgr.getChallenge(ch.challengeId)!.status).toBe("timed-out");
    expect(h.holds.has("ses_1", "mfa")).toBe(false);
    expect(h.pause.discardPause).toHaveBeenCalledWith("pause_tok");
    expect(h.logger.log).toHaveBeenCalledWith(expect.objectContaining({ event: "mfa.challenge.expired" }));
  });

  it("a resolved challenge does not later expire", async () => {
    const h = harness();
    const mgr = new MfaChallengeManager(h.sessions as any, h.typeHandler, h.notifier, h.logger, h.holds, 1000, h.pause);
    mgr.setBaseUrl("http://localhost:3333");
    const ch = await mgr.createChallenge({ sessionId: "ses_1", type: "push", prompt: "x" });
    await mgr.resolveChallenge(ch.challengeId, undefined, tokenFromNotify(h.notifier), ctx);
    await vi.advanceTimersByTimeAsync(2000);
    expect(mgr.getChallenge(ch.challengeId)!.status).toBe("resolved");
  });

  it("cancelForSession times out pending challenges and releases their holds", async () => {
    const h = harness();
    const mgr = new MfaChallengeManager(h.sessions as any, h.typeHandler, h.notifier, h.logger, h.holds, 300000, h.pause);
    mgr.setBaseUrl("http://localhost:3333");
    const ch = await mgr.createChallenge({ sessionId: "ses_1", type: "push", prompt: "x" });
    await mgr.cancelForSession("ses_1");
    expect(mgr.getChallenge(ch.challengeId)!.status).toBe("timed-out");
    expect(h.holds.has("ses_1", "mfa")).toBe(false);
  });
});
