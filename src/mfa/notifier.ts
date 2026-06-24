import type { MfaChallenge, MfaConfig, MfaNotifier, MfaNotifyUrls, TelegramNotifierConfig } from "./types";

export class ConsoleNotifier implements MfaNotifier {
  // Console output is a shared/logged sink, so it gets the token-less agentUrl only — never the bearer.
  async notify(challenge: MfaChallenge, urls: MfaNotifyUrls): Promise<void> {
    console.log(`[mfa] ${challenge.type} challenge for "${challenge.prompt}" — resolve at: ${urls.agentUrl}`);
  }
}

export class CompositeNotifier implements MfaNotifier {
  constructor(private readonly notifiers: MfaNotifier[]) {}
  async notify(challenge: MfaChallenge, urls: MfaNotifyUrls): Promise<void> {
    await Promise.allSettled(this.notifiers.map((n) => n.notify(challenge, urls)));
  }
}

export class TelegramNotifier implements MfaNotifier {
  constructor(private readonly config: TelegramNotifierConfig) {}
  // Telegram is a private DM to the human, so it carries the actionable humanUrl (with the bearer token).
  async notify(challenge: MfaChallenge, urls: MfaNotifyUrls): Promise<void> {
    const link = urls.humanUrl;
    const text =
      challenge.type === "push"
        ? `Feather needs you to approve "${challenge.prompt}" on your phone, then confirm here: ${link}`
        : `Feather needs a 2FA code for "${challenge.prompt}". Enter it here: ${link}`;
    await fetch(`https://api.telegram.org/bot${this.config.botToken}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: this.config.chatId, text }),
    });
  }
}

export function buildNotifier(config: MfaConfig): MfaNotifier {
  const notifiers: MfaNotifier[] = [new ConsoleNotifier()];
  if (config.telegram) {
    return new CompositeNotifier([...notifiers, new TelegramNotifier(config.telegram)]);
  }
  return notifiers[0];
}
