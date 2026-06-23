import { vi, describe, it, expect } from "vitest";
import { CreateMfaChallengeHandler, GetMfaChallengeHandler } from "../../../src/commands/mfa-challenge";
import { MfaChallengeNotFoundError } from "../../../src/mfa/types";

const ctx = { requestId: "req_test" };

describe("CreateMfaChallengeHandler", () => {
  it("delegates to the manager and returns challengeId, localUrl, expiresAt", async () => {
    const challenge = {
      challengeId: "mfa_abc", sessionId: "ses_1", type: "totp",
      prompt: "x", status: "pending", createdAt: "t", expiresAt: "t2",
    };
    const mgr = {
      createChallenge: vi.fn().mockResolvedValue(challenge),
      localUrlFor: vi.fn().mockReturnValue("http://localhost:3333/v1/mfa/mfa_abc"),
    } as any;
    const out = await new CreateMfaChallengeHandler(mgr).execute(
      { sessionId: "ses_1", type: "totp", target: { by: "css", selector: "#c" }, prompt: "x" }, ctx);
    expect(mgr.createChallenge).toHaveBeenCalled();
    expect(out).toEqual({ challengeId: "mfa_abc", localUrl: "http://localhost:3333/v1/mfa/mfa_abc", expiresAt: "t2" });
  });
});

describe("GetMfaChallengeHandler", () => {
  it("returns the challenge status", async () => {
    const mgr = { getChallenge: vi.fn().mockReturnValue({ status: "pending" }) } as any;
    const out = await new GetMfaChallengeHandler(mgr).execute({ sessionId: "ses_1", challengeId: "mfa_abc" }, ctx);
    expect(out).toEqual({ status: "pending" });
  });
  it("throws MFA_NOT_FOUND when missing", async () => {
    const mgr = { getChallenge: vi.fn().mockReturnValue(undefined) } as any;
    await expect(new GetMfaChallengeHandler(mgr).execute({ sessionId: "ses_1", challengeId: "nope" }, ctx))
      .rejects.toBeInstanceOf(MfaChallengeNotFoundError);
  });
});
