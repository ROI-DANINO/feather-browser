// Human approval page for a Dangerous-tier capability grant (Gate A / A1). Same shape as the resume
// page: a dumb local page with no external resources (a strict CSP is set on the response). The form
// posts back the per-page CSRF nonce; the URL carries the single-use humanToken. The agent never
// sees this page or its tokens.

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function shell(body: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<title>Feather — Approve capability</title></head>` +
    `<body style="font-family:system-ui,sans-serif;max-width:34rem;margin:3rem auto;padding:0 1rem;color:#111">` +
    body + `</body></html>`;
}

/** The content-security-policy for the approval/resume pages: self only, no external anything. */
export const APPROVAL_CSP =
  "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'";

export interface ApprovalView {
  humanToken: string;
  sessionId: string;
  capability: string;
  ttlSeconds: number;
  csrfNonce: string;
}

const CAPABILITY_BLURB: Record<string, string> = {
  "cdp-attach": "raw debugger access to this warmed browser profile",
  "vault-unlock": "release of a stored credential",
  "cookie-export": "export of this session's cookies (login tokens)",
};

export function approvalPage(view: ApprovalView): string {
  const what = CAPABILITY_BLURB[view.capability] ?? esc(view.capability);
  // Action + CSRF ride in the form-action query string (not the body): Feather's urlencoded parser
  // intentionally discards bodies, and the resume page already carries its token the same way. A0
  // blocks cross-origin POSTs outright, so the nonce is single-use defense-in-depth on top of that.
  const base = `/v1/approvals/${encodeURIComponent(view.humanToken)}?csrf=${encodeURIComponent(view.csrfNonce)}`;
  const btn = (bg: string, fg: string, border: string) =>
    `font-size:1rem;padding:.7rem 1.6rem;border:${border};border-radius:.5rem;background:${bg};color:${fg};cursor:pointer`;
  return shell(
    `<h1 style="font-size:1.4rem">Feather wants permission</h1>` +
    `<p style="color:#444">An agent is requesting <strong>${esc(view.capability)}</strong> — ${esc(what)} — ` +
    `on session <code>${esc(view.sessionId)}</code>.</p>` +
    `<p style="color:#888;font-size:.9rem">This permission self-expires in ${view.ttlSeconds}s and is single-use.</p>` +
    `<div style="display:flex;gap:.75rem;margin-top:1.5rem">` +
    `<form method="POST" action="${base}&amp;action=approve">` +
    `<button type="submit" style="${btn("#1a73e8", "#fff", "0")}">Approve</button></form>` +
    `<form method="POST" action="${base}&amp;action=deny">` +
    `<button type="submit" style="${btn("#fff", "#333", "1px solid #ccc")}">Deny</button></form>` +
    `</div>`,
  );
}

export function approvedPage(): string {
  return shell(`<h1 style="font-size:1.4rem">✓ Approved</h1>` +
    `<p style="color:#444">The agent may proceed once — then this permission is spent. You can return to it.</p>`);
}

export function deniedPage(): string {
  return shell(`<h1 style="font-size:1.4rem">✗ Denied</h1>` +
    `<p style="color:#444">Nothing was granted. You can return to the agent.</p>`);
}

export function expiredApprovalPage(): string {
  return shell(`<h1 style="font-size:1.4rem">Expired or already answered</h1>` +
    `<p style="color:#444">Nothing more to do here.</p>`);
}
