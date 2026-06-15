import { describe, it, expect, beforeEach } from "vitest";
import { createPause, peekPause, resumePause, discardPause, isPagePaused, assertPageNotPaused, HumanInControlError, _resetForTests } from "../../../src/commands/pause-registry";

beforeEach(() => _resetForTests());

describe("PauseRegistry", () => {
  it("createPause returns a token, a session-scoped path, and a pending promise", () => {
    const p = createPause("ses_1", "Solve the CAPTCHA");
    expect(p.token).toMatch(/^[0-9a-f]{32}$/);
    expect(p.resumePath).toBe(`/v1/sessions/ses_1/resume?token=${p.token}`);
    expect(p.humanResumed).toBeInstanceOf(Promise);
  });

  it("peekPause returns reason + sessionId while pending, undefined after resume", () => {
    const p = createPause("ses_1", "Solve the CAPTCHA");
    expect(peekPause(p.token)).toEqual({ sessionId: "ses_1", reason: "Solve the CAPTCHA" });
    resumePause(p.token, "ses_1");
    expect(peekPause(p.token)).toBeUndefined();
  });

  it("resumePause resolves the pending promise and returns true (once)", async () => {
    const p = createPause("ses_1", "x");
    let resolved = false;
    void p.humanResumed.then(() => { resolved = true; });
    expect(resumePause(p.token, "ses_1")).toBe(true);
    await p.humanResumed;
    expect(resolved).toBe(true);
    expect(resumePause(p.token, "ses_1")).toBe(false); // already consumed
  });

  it("resumePause rejects a wrong sessionId and an unknown token", () => {
    const p = createPause("ses_1", "x");
    expect(resumePause(p.token, "ses_OTHER")).toBe(false);
    expect(resumePause("deadbeef", "ses_1")).toBe(false);
    expect(resumePause(p.token, "ses_1")).toBe(true); // still valid for the right session
  });

  it("discardPause removes a pending pause without resolving false-positively", () => {
    const p = createPause("ses_1", "x");
    discardPause(p.token);
    expect(peekPause(p.token)).toBeUndefined();
    expect(resumePause(p.token, "ses_1")).toBe(false);
  });

  describe("page-scoped pause guard (human-in-control)", () => {
    it("isPagePaused is true only for the exact (session, page) under an active pause", () => {
      createPause("ses_1", "x", "page_A");
      expect(isPagePaused("ses_1", "page_A")).toBe(true);
      expect(isPagePaused("ses_1", "page_B")).toBe(false); // a different tab is free
      expect(isPagePaused("ses_2", "page_A")).toBe(false); // a different session is free
    });

    it("isPagePaused goes false once the pause is resumed or discarded", () => {
      const p1 = createPause("ses_1", "x", "page_A");
      resumePause(p1.token, "ses_1");
      expect(isPagePaused("ses_1", "page_A")).toBe(false);

      const p2 = createPause("ses_1", "x", "page_A");
      discardPause(p2.token);
      expect(isPagePaused("ses_1", "page_A")).toBe(false);
    });

    it("a pause created without a pageId scopes to no page (never blocks)", () => {
      createPause("ses_1", "x");
      expect(isPagePaused("ses_1", "page_A")).toBe(false);
    });

    it("assertPageNotPaused throws HUMAN_IN_CONTROL while paused, is a no-op otherwise", () => {
      createPause("ses_1", "Solve the CAPTCHA", "page_A");
      try {
        assertPageNotPaused("ses_1", "page_A");
        expect.unreachable("should have thrown");
      } catch (e) {
        expect(e).toBeInstanceOf(HumanInControlError);
        expect((e as HumanInControlError).code).toBe("HUMAN_IN_CONTROL");
      }
      expect(() => assertPageNotPaused("ses_1", "page_B")).not.toThrow();
    });
  });
});
