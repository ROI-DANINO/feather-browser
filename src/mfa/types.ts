import type { Target } from "../sessions/types";

export type MfaChallengeStatus = "pending" | "resolved" | "timed-out";
export type MfaType = "totp" | "sms" | "push";

export interface MfaChallenge {
  challengeId: string;
  sessionId: string;
  pageId?: string;
  type: MfaType;
  target?: Target; // REQUIRED for totp/sms, ABSENT for push
  prompt: string;
  status: MfaChallengeStatus;
  createdAt: string; // ISO
  expiresAt: string; // ISO
  resolvedAt?: string; // ISO, set on resolve
}

export interface CreateChallengeInput {
  sessionId: string;
  pageId?: string;
  type: MfaType;
  target?: Target;
  prompt: string;
  timeoutMs?: number;
}

export interface MfaNotifier {
  notify(challenge: MfaChallenge, localUrl: string): Promise<void>;
}

export interface TelegramNotifierConfig {
  botToken: string;
  chatId: string;
}

export interface MfaConfig {
  telegram?: TelegramNotifierConfig;
  defaultTimeoutMs: number; // resolved (never undefined after loadMfaConfig)
}

export class MfaChallengeNotFoundError extends Error {
  readonly code = "MFA_NOT_FOUND";
  constructor(message: string) {
    super(message);
    this.name = "MfaChallengeNotFoundError";
  }
}

export class MfaNotPendingError extends Error {
  readonly code = "MFA_NOT_PENDING";
  constructor(message: string) {
    super(message);
    this.name = "MfaNotPendingError";
  }
}

export class MfaValidationError extends Error {
  readonly code = "VALIDATION_ERROR";
  constructor(message: string) {
    super(message);
    this.name = "MfaValidationError";
  }
}

export class MfaForbiddenError extends Error {
  readonly code = "MFA_FORBIDDEN";
  constructor(message: string) {
    super(message);
    this.name = "MfaForbiddenError";
  }
}

const NEEDS_CODE = new Set<MfaType>(["totp", "sms"]);

export function requireTargetForType(type: MfaType, target?: Target): void {
  if (NEEDS_CODE.has(type) && !target) {
    throw new MfaValidationError(`MFA type "${type}" requires a target field to type the code into.`);
  }
  if (type === "push" && target) {
    throw new MfaValidationError(`MFA type "push" must not include a target (nothing is typed).`);
  }
}

export function requireCodeForType(type: MfaType, code?: string): void {
  if (NEEDS_CODE.has(type) && (code === undefined || code.length === 0)) {
    throw new MfaValidationError(`MFA type "${type}" requires a non-empty code.`);
  }
}
