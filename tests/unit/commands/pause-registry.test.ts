import { describe, it, expect, beforeEach } from "vitest";
import { createPause, peekPause, resumePause, discardPause, _resetForTests } from "../../../src/commands/pause-registry";

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
});
