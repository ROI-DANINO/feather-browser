import { randomBytes } from "crypto";
import type { CommandHandler, CommandContext } from "../commands/handler";
import type { TypeInput, TypeOutput } from "../sessions/types";
import type { FeatherLogger } from "../logs/logger";
import type { SessionHoldRegistry, HoldHandle } from "../capability/holds";
import { createPause, resumePause, discardPause } from "../commands/pause-registry";
import { EVENTS } from "../logs/events";
import {
  MfaChallenge,
  CreateChallengeInput,
  MfaChallengeNotFoundError,
  MfaNotPendingError,
  MfaForbiddenError,
  MfaNotifier,
  requireTargetForType,
  requireCodeForType,
} from "./types";

// Minimal structural view of what the manager needs from a session (mirrors await-human's IManager).
// The real SessionManager.get() returns a FeatherSession, which satisfies this at runtime.
interface MfaSession {
  getPage(pageId?: string): { pageId: string; page: { url(): string } };
}
interface MfaSessionLookup {
  get(sessionId: string): MfaSession;
}

/** Pause primitives, injectable so unit tests can assert create/resume without the module registry. */
export interface PauseDeps {
  createPause: typeof createPause;
  resumePause: typeof resumePause;
  discardPause: typeof discardPause;
}
const defaultPauseDeps: PauseDeps = { createPause, resumePause, discardPause };

/** Secrets + live handles kept off the public MfaChallenge so getChallenge() never leaks them. */
interface ChallengeInternals {
  hold: HoldHandle;
  pauseToken: string;
  humanToken: string;
  csrfNonce?: string;
  createOrigin: string;
  pageId?: string;
  timer?: ReturnType<typeof setTimeout>;
}

const newChallengeId = (): string => `mfa_${randomBytes(8).toString("hex")}`; // 128-bit identifier
const newHumanToken = (): string => randomBytes(32).toString("hex"); // 256-bit bearer secret (S2)

function originOf(url: string): string {
  try {
    return new URL(url).origin;
  } catch {
    return "";
  }
}

/**
 * Owns in-flight MFA challenges. Reconciled onto Gate A (2026-06-23): a challenge takes an `mfa`
 * session-hold and a banner-free pause (so the existing HUMAN_IN_CONTROL guard suspends the agent)
 * instead of toggling a now-deferred stealth mode. Resolve/expire release both. In-memory only —
 * challenges live ≤ the timeout. See docs/specs/2026-06-23-mfa-5b-reconciliation.md.
 */
export class MfaChallengeManager {
  private readonly challenges = new Map<string, MfaChallenge>();
  private readonly internals = new Map<string, ChallengeInternals>();
  private baseUrl = "http://localhost:3333";

  constructor(
    private readonly sessions: MfaSessionLookup,
    private readonly typeHandler: CommandHandler<TypeInput, TypeOutput>,
    private readonly notifier: MfaNotifier,
    private readonly logger: FeatherLogger,
    private readonly holds: SessionHoldRegistry,
    private readonly defaultTimeoutMs: number,
    private readonly pause: PauseDeps = defaultPauseDeps,
  ) {}

  setBaseUrl(baseUrl: string): void {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  /** Agent-facing URL — token-less (the bearer secret stays out of agent/LLM space, S6). */
  localUrlFor(challengeId: string): string {
    return `${this.baseUrl}/v1/mfa/${challengeId}`;
  }

  /** Human-facing URL carrying the single-use humanToken — what the notifier sends to the human. */
  humanUrlFor(challengeId: string, humanToken: string): string {
    return `${this.localUrlFor(challengeId)}?t=${humanToken}`;
  }

  getChallenge(challengeId: string): MfaChallenge | undefined {
    return this.challenges.get(challengeId);
  }

  /** Routes verify the bearer secret here (constant-ish length compare). */
  verifyHumanToken(challengeId: string, humanToken: string | undefined): boolean {
    const internal = this.internals.get(challengeId);
    return !!internal && !!humanToken && internal.humanToken === humanToken;
  }

  /** The local page mints a per-render CSRF nonce; submit verifies it. Defense-in-depth atop the
   * global Origin/Host guard. */
  setCsrfNonce(challengeId: string, nonce: string): void {
    const internal = this.internals.get(challengeId);
    if (internal) internal.csrfNonce = nonce;
  }

  verifyCsrfNonce(challengeId: string, nonce: string | undefined): boolean {
    // A submit that carries no nonce (programmatic JSON) relies on the humanToken + the global
    // Origin/Host guard. A submit that DOES carry one (a real browser form) must match what the
    // page render stored — so a forged nonce is rejected.
    if (nonce === undefined) return true;
    const internal = this.internals.get(challengeId);
    return !!internal && internal.csrfNonce !== undefined && internal.csrfNonce === nonce;
  }

  async createChallenge(input: CreateChallengeInput): Promise<MfaChallenge> {
    requireTargetForType(input.type, input.target);

    const session = this.sessions.get(input.sessionId); // throws SESSION_NOT_FOUND if missing
    const { pageId, page } = session.getPage(input.pageId);
    const createOrigin = originOf(page.url());

    const now = Date.now();
    const timeoutMs = input.timeoutMs ?? this.defaultTimeoutMs;
    const challengeId = newChallengeId();
    const challenge: MfaChallenge = {
      challengeId,
      sessionId: input.sessionId,
      pageId,
      type: input.type,
      target: input.target,
      prompt: input.prompt,
      status: "pending",
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + timeoutMs).toISOString(),
    };

    // Replace the deferred setStealthMode toggle with an `mfa` hold + a banner-free pause.
    const hold = this.holds.createHold(input.sessionId, "mfa");
    const pause = this.pause.createPause(input.sessionId, "mfa", pageId);
    const humanToken = newHumanToken();

    this.challenges.set(challengeId, challenge);
    const timer = setTimeout(() => {
      void this.expire(challengeId);
    }, timeoutMs);
    this.internals.set(challengeId, {
      hold,
      pauseToken: pause.token,
      humanToken,
      createOrigin,
      pageId,
      timer,
    });

    await this.logger.log({
      ts: challenge.createdAt,
      level: "info",
      event: EVENTS.MFA_CHALLENGE_CREATED,
      sessionId: challenge.sessionId,
      data: { challengeId, type: challenge.type },
    });

    try {
      await this.notifier.notify(challenge, this.humanUrlFor(challengeId, humanToken));
    } catch {
      /* notification failure must not fail challenge creation */
    }

    return challenge;
  }

  async resolveChallenge(
    challengeId: string,
    code: string | undefined,
    humanToken: string | undefined,
    ctx: CommandContext,
  ): Promise<MfaChallenge> {
    const challenge = this.challenges.get(challengeId);
    if (!challenge) throw new MfaChallengeNotFoundError(`MFA challenge '${challengeId}' not found.`);
    if (challenge.status !== "pending") {
      throw new MfaNotPendingError(`MFA challenge '${challengeId}' is '${challenge.status}', not pending.`);
    }
    const internal = this.internals.get(challengeId)!;

    // Bearer-secret check: the challengeId is an identifier, the humanToken is the secret (S2).
    if (!this.verifyHumanToken(challengeId, humanToken)) {
      throw new MfaForbiddenError(`Invalid or missing humanToken for challenge '${challengeId}'.`);
    }

    requireCodeForType(challenge.type, code);

    // Anti-phishing (S3): the page origin must be unchanged since challenge creation before we type a
    // real code into it. Origin (not full URL) so push flows that advance the path still pass.
    const { page } = this.sessions.get(challenge.sessionId).getPage(internal.pageId);
    if (originOf(page.url()) !== internal.createOrigin) {
      throw new MfaForbiddenError(
        `Page origin changed since the MFA challenge was created; refusing to type the code.`,
      );
    }

    if (challenge.type !== "push" && challenge.target) {
      await this.typeHandler.execute(
        {
          sessionId: challenge.sessionId,
          pageId: internal.pageId,
          target: challenge.target,
          text: code as string,
          mode: "sequential",
        },
        ctx,
      );
    }

    challenge.status = "resolved";
    challenge.resolvedAt = new Date().toISOString();
    await this.release(challengeId, EVENTS.MFA_CHALLENGE_RESOLVED);
    return challenge;
  }

  /** Cancel every pending challenge for a session (S5: called on session close). */
  async cancelForSession(sessionId: string): Promise<void> {
    for (const challenge of this.challenges.values()) {
      if (challenge.sessionId === sessionId && challenge.status === "pending") {
        challenge.status = "timed-out";
        await this.release(challenge.challengeId, EVENTS.MFA_CHALLENGE_EXPIRED);
      }
    }
  }

  private async expire(challengeId: string): Promise<void> {
    const challenge = this.challenges.get(challengeId);
    if (!challenge || challenge.status !== "pending") return;
    challenge.status = "timed-out";
    await this.release(challengeId, EVENTS.MFA_CHALLENGE_EXPIRED);
  }

  /** Release the hold + pause, clear the timer, and log the terminal event. Idempotent-safe. */
  private async release(
    challengeId: string,
    event: typeof EVENTS.MFA_CHALLENGE_RESOLVED | typeof EVENTS.MFA_CHALLENGE_EXPIRED,
  ): Promise<void> {
    const challenge = this.challenges.get(challengeId);
    const internal = this.internals.get(challengeId);
    if (internal) {
      if (internal.timer) clearTimeout(internal.timer);
      this.pause.resumePause(internal.pauseToken, challenge?.sessionId ?? internal.hold.sessionId);
      this.pause.discardPause(internal.pauseToken);
      await this.holds.release(internal.hold);
    }
    if (challenge) {
      await this.logger.log({
        ts: new Date().toISOString(),
        level: "info",
        event,
        sessionId: challenge.sessionId,
        data: { challengeId, type: challenge.type },
      });
    }
  }
}
