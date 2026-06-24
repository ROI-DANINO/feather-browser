import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { TelegramNotifier } from "../../../src/mfa/notifier";
import type { MfaChallenge } from "../../../src/mfa/types";

const code: MfaChallenge = {
  challengeId: "mfa_abc",
  sessionId: "ses_1",
  type: "totp",
  target: { by: "css", selector: "#code" },
  prompt: "LinkedIn 2FA",
  status: "pending",
  createdAt: "t",
  expiresAt: "t",
};
const push: MfaChallenge = { ...code, type: "push", target: undefined, prompt: "Google sign-in" };
const AGENT_URL = "http://localhost:3333/v1/mfa/mfa_abc";
const HUMAN_URL = `${AGENT_URL}?t=secrettoken123`;
const URLS = { agentUrl: AGENT_URL, humanUrl: HUMAN_URL };

describe("TelegramNotifier", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("POSTs to the Telegram sendMessage endpoint with chat id and the human (token-bearing) url", async () => {
    await new TelegramNotifier({ botToken: "BOT", chatId: "42" }).notify(code, URLS);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.telegram.org/botBOT/sendMessage");
    const body = JSON.parse((init as any).body);
    expect(body.chat_id).toBe("42");
    expect(body.text).toContain(HUMAN_URL);
    expect(body.text).toContain("code");
  });

  it("uses approve phrasing for push challenges", async () => {
    await new TelegramNotifier({ botToken: "BOT", chatId: "42" }).notify(push, URLS);
    const body = JSON.parse((fetchMock.mock.calls[0][1] as any).body);
    expect(body.text.toLowerCase()).toContain("approve");
  });
});
