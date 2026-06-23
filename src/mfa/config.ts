import type { MfaConfig } from "./types";

const DEFAULT_TIMEOUT_MS = 300_000;

export function loadMfaConfig(env: NodeJS.ProcessEnv = process.env): MfaConfig {
  const botToken = env.FEATHER_TELEGRAM_BOT_TOKEN;
  const chatId = env.FEATHER_TELEGRAM_CHAT_ID;

  const parsed = Number(env.FEATHER_MFA_TIMEOUT_MS);
  const defaultTimeoutMs = Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TIMEOUT_MS;

  const config: MfaConfig = { defaultTimeoutMs };
  if (botToken && chatId) {
    config.telegram = { botToken, chatId };
  }
  return config;
}
