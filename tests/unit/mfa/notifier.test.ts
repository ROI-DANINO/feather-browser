import { vi, describe, it, expect, beforeEach } from "vitest";
import { ConsoleNotifier, CompositeNotifier, buildNotifier } from "../../../src/mfa/notifier";
import type { MfaChallenge, MfaNotifier } from "../../../src/mfa/types";

const challenge: MfaChallenge = {
  challengeId: "mfa_abc",
  sessionId: "ses_1",
  type: "totp",
  target: { by: "css", selector: "#code" },
  prompt: "LinkedIn 2FA",
  status: "pending",
  createdAt: "t",
  expiresAt: "t",
};
const URL = "http://localhost:3333/v1/mfa/mfa_abc";

describe("ConsoleNotifier", () => {
  beforeEach(() => vi.restoreAllMocks());
  it("logs the local url", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    await new ConsoleNotifier().notify(challenge, URL);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining(URL));
  });
});

describe("CompositeNotifier", () => {
  it("calls every child notifier", async () => {
    const a: MfaNotifier = { notify: vi.fn().mockResolvedValue(undefined) };
    const b: MfaNotifier = { notify: vi.fn().mockResolvedValue(undefined) };
    await new CompositeNotifier([a, b]).notify(challenge, URL);
    expect(a.notify).toHaveBeenCalledWith(challenge, URL);
    expect(b.notify).toHaveBeenCalledWith(challenge, URL);
  });
  it("does not let one failure block the others", async () => {
    const bad: MfaNotifier = { notify: vi.fn().mockRejectedValue(new Error("boom")) };
    const good: MfaNotifier = { notify: vi.fn().mockResolvedValue(undefined) };
    await new CompositeNotifier([bad, good]).notify(challenge, URL);
    expect(good.notify).toHaveBeenCalled();
  });
});

describe("buildNotifier", () => {
  it("returns console-only when no telegram config", () => {
    const n = buildNotifier({ defaultTimeoutMs: 300000 });
    expect(n).toBeInstanceOf(ConsoleNotifier);
  });
  it("returns a composite including telegram when configured", () => {
    const n = buildNotifier({ defaultTimeoutMs: 300000, telegram: { botToken: "t", chatId: "c" } });
    expect(n).toBeInstanceOf(CompositeNotifier);
  });
});
