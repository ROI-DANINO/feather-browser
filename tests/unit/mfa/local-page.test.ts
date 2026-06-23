import { describe, it, expect } from "vitest";
import { renderChallengePage } from "../../../src/mfa/local-page";
import type { MfaChallenge } from "../../../src/mfa/types";

const base: MfaChallenge = {
  challengeId: "mfa_abc",
  sessionId: "ses_1",
  type: "totp",
  target: { by: "css", selector: "#code" },
  prompt: "LinkedIn 2FA",
  status: "pending",
  createdAt: "2026-06-07T00:00:00.000Z",
  expiresAt: "2026-06-07T00:05:00.000Z",
};

describe("renderChallengePage", () => {
  it("renders a code input and a form posting to the submit endpoint for totp", () => {
    const html = renderChallengePage(base);
    expect(html).toContain("LinkedIn 2FA");
    expect(html).toContain('action="/v1/mfa/mfa_abc/submit"');
    expect(html).toContain("<input");
    expect(html).toContain('name="code"');
  });

  it("renders a Done button and no code input for push", () => {
    const html = renderChallengePage({ ...base, type: "push", target: undefined });
    expect(html).toContain("Approve");
    expect(html).toContain('action="/v1/mfa/mfa_abc/submit"');
    expect(html).not.toContain('name="code"');
  });

  it("HTML-escapes the prompt to prevent injection", () => {
    const html = renderChallengePage({ ...base, prompt: "<script>alert(1)</script>" });
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("injects humanToken and csrfNonce as hidden fields when provided", () => {
    const html = renderChallengePage(base, { humanToken: "ht_secret", csrfNonce: "nonce_xyz" });
    expect(html).toContain('name="humanToken"');
    expect(html).toContain("ht_secret");
    expect(html).toContain('name="csrfNonce"');
    expect(html).toContain("nonce_xyz");
  });

  it("omits the hidden fields when not provided", () => {
    const html = renderChallengePage(base);
    expect(html).not.toContain('name="humanToken"');
    expect(html).not.toContain('name="csrfNonce"');
  });
});
