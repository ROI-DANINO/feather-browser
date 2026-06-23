import { describe, it, expect } from "vitest";
import { loadMfaConfig } from "../../../src/mfa/config";

describe("loadMfaConfig", () => {
  it("defaults timeout to 5 minutes and omits telegram when unset", () => {
    const cfg = loadMfaConfig({});
    expect(cfg.defaultTimeoutMs).toBe(300000);
    expect(cfg.telegram).toBeUndefined();
  });

  it("includes telegram only when both token and chat id are present", () => {
    expect(loadMfaConfig({ FEATHER_TELEGRAM_BOT_TOKEN: "t" }).telegram).toBeUndefined();
    expect(loadMfaConfig({ FEATHER_TELEGRAM_CHAT_ID: "c" }).telegram).toBeUndefined();
    const cfg = loadMfaConfig({ FEATHER_TELEGRAM_BOT_TOKEN: "t", FEATHER_TELEGRAM_CHAT_ID: "c" });
    expect(cfg.telegram).toEqual({ botToken: "t", chatId: "c" });
  });

  it("honors FEATHER_MFA_TIMEOUT_MS override", () => {
    expect(loadMfaConfig({ FEATHER_MFA_TIMEOUT_MS: "60000" }).defaultTimeoutMs).toBe(60000);
  });

  it("ignores a non-numeric timeout override", () => {
    expect(loadMfaConfig({ FEATHER_MFA_TIMEOUT_MS: "abc" }).defaultTimeoutMs).toBe(300000);
  });
});
