import type { MfaChallenge, MfaConfig, MfaNotifier, TelegramNotifierConfig } from "./types";

export class ConsoleNotifier implements MfaNotifier {
  async notify(challenge: MfaChallenge, localUrl: string): Promise<void> {
    console.log(`[mfa] ${challenge.type} challenge for "${challenge.prompt}" — resolve at: ${localUrl}`);
  }
}

export class CompositeNotifier implements MfaNotifier {
  constructor(private readonly notifiers: MfaNotifier[]) {}
  async notify(challenge: MfaChallenge, localUrl: string): Promise<void> {
    await Promise.allSettled(this.notifiers.map((n) => n.notify(challenge, localUrl)));
  }
}

export class TelegramNotifier implements MfaNotifier {
  constructor(private readonly config: TelegramNotifierConfig) {}
  async notify(challenge: MfaChallenge, localUrl: string): Promise<void> {
    const text =
      challenge.type === "push"
        ? `Feather needs you to approve "${challenge.prompt}" on your phone, then confirm here: ${localUrl}`
        : `Feather needs a 2FA code for "${challenge.prompt}". Enter it here: ${localUrl}`;
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
