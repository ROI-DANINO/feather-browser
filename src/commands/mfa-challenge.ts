import type { CommandContext } from "./handler";
import type { MfaChallengeManager } from "../mfa/manager";
import type { CreateChallengeInput, MfaChallengeStatus } from "../mfa/types";
import { MfaChallengeNotFoundError } from "../mfa/types";

export class CreateMfaChallengeHandler {
  constructor(private readonly mgr: MfaChallengeManager) {}
  async execute(
    input: CreateChallengeInput,
    _ctx: CommandContext,
  ): Promise<{ challengeId: string; localUrl: string; expiresAt: string }> {
    const challenge = await this.mgr.createChallenge(input);
    return {
      challengeId: challenge.challengeId,
      localUrl: this.mgr.localUrlFor(challenge.challengeId),
      expiresAt: challenge.expiresAt,
    };
  }
}

export class GetMfaChallengeHandler {
  constructor(private readonly mgr: MfaChallengeManager) {}
  async execute(
    input: { sessionId: string; challengeId: string },
    _ctx: CommandContext,
  ): Promise<{ status: MfaChallengeStatus }> {
    const challenge = this.mgr.getChallenge(input.challengeId);
    if (!challenge) throw new MfaChallengeNotFoundError(`MFA challenge '${input.challengeId}' not found.`);
    return { status: challenge.status };
  }
}
