import { randomBytes } from "crypto";

// ── Approval store (Gate A / A1) ─────────────────────────────────────────────
// Backs the human approval page, reusing the MFA local-page security stack (S1): the URL carries an
// unguessable single-use `humanToken` (an identifier, NOT the grant secret); the page embeds a
// per-page `csrfNonce` that must be posted back on approve/deny. Both are 256-bit CSPRNG. Pairs one
// approval ceremony to one grant. In-memory like the pause registry — grants and their approvals die
// on restart by design. See docs/specs/2026-06-11-a1-slice3-plan.md.

interface PendingApproval {
  grantId: string;
  csrfNonce: string;
}

export type ConsumeResult =
  | { ok: true; grantId: string }
  | { ok: false; reason: "unknown-token" | "bad-csrf" };

export class ApprovalStore {
  private readonly byToken = new Map<string, PendingApproval>();

  /** Create the URL token + CSRF nonce for a grant's approval ceremony. */
  mint(grantId: string): { humanToken: string; csrfNonce: string } {
    const humanToken = randomBytes(32).toString("base64url");
    const csrfNonce = randomBytes(32).toString("base64url");
    this.byToken.set(humanToken, { grantId, csrfNonce });
    return { humanToken, csrfNonce };
  }

  /** Read what an approval page needs to render (grant + CSRF to embed). Does not consume. */
  peek(humanToken: string): PendingApproval | undefined {
    return this.byToken.get(humanToken);
  }

  /** Single-use redemption of the approval. Requires the matching CSRF nonce. */
  consume(humanToken: string, csrfNonce: string): ConsumeResult {
    const pending = this.byToken.get(humanToken);
    if (!pending) return { ok: false, reason: "unknown-token" };
    if (pending.csrfNonce !== csrfNonce) return { ok: false, reason: "bad-csrf" };
    this.byToken.delete(humanToken);
    return { ok: true, grantId: pending.grantId };
  }

  /** Drop the approval for a grant that ended some other way (revoked, expired, session close). */
  discard(grantId: string): void {
    for (const [token, pending] of this.byToken) {
      if (pending.grantId === grantId) this.byToken.delete(token);
    }
  }
}
