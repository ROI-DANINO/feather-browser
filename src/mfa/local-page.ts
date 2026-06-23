import type { MfaChallenge } from "./types";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Optional hardening hooks injected by the route layer (see the 5b reconciliation note). When
 * present, `humanToken` is carried as a hidden field (the bearer secret, separate from the
 * challengeId identifier) and `csrfNonce` is posted back and verified on submit. The renderer stays
 * a pure template — the strict CSP header is set by the route, not here.
 */
export interface RenderOptions {
  humanToken?: string;
  csrfNonce?: string;
}

export function renderChallengePage(challenge: MfaChallenge, opts: RenderOptions = {}): string {
  const prompt = escapeHtml(challenge.prompt);
  const action = `/v1/mfa/${escapeHtml(challenge.challengeId)}/submit`;
  const expires = escapeHtml(challenge.expiresAt);

  const hidden = [
    opts.humanToken ? `<input type="hidden" name="humanToken" value="${escapeHtml(opts.humanToken)}" />` : "",
    opts.csrfNonce ? `<input type="hidden" name="csrfNonce" value="${escapeHtml(opts.csrfNonce)}" />` : "",
  ].join("");

  const body =
    challenge.type === "push"
      ? `<p>Approve the request on your phone, then click Done.</p>
         <form method="POST" action="${action}">
           ${hidden}
           <button type="submit">Done</button>
         </form>`
      : `<form method="POST" action="${action}">
           ${hidden}
           <input name="code" inputmode="numeric" autocomplete="one-time-code"
                  autofocus placeholder="Enter code" />
           <button type="submit">Submit</button>
         </form>`;

  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Feather MFA</title>
<style>body{font-family:system-ui,sans-serif;max-width:24rem;margin:4rem auto;padding:0 1rem}
input,button{font-size:1.1rem;padding:.5rem;margin-top:.5rem}</style></head>
<body>
  <h1>${prompt}</h1>
  ${body}
  <p style="color:#888;font-size:.85rem">Expires at ${expires}</p>
</body></html>`;
}
