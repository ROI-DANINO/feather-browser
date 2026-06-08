function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function shell(body: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<title>Feather — Resume</title></head>` +
    `<body style="font-family:system-ui,sans-serif;max-width:32rem;margin:4rem auto;padding:0 1rem;text-align:center;color:#111">` +
    body + `</body></html>`;
}

/** The page the human opens from the Resume link: reason + a button that POSTs to resume. */
export function promptPage(reason: string): string {
  return shell(
    `<h1 style="font-size:1.4rem">Feather is paused</h1>` +
    `<p style="color:#444">${esc(reason)}</p>` +
    `<form method="POST" action="">` +
    `<button type="submit" style="font-size:1rem;padding:.7rem 1.6rem;border:0;border-radius:.5rem;` +
    `background:#1a73e8;color:#fff;cursor:pointer">Resume ▸</button></form>`,
  );
}

export function confirmedPage(): string {
  return shell(`<h1 style="font-size:1.4rem">✓ Resumed</h1><p style="color:#444">You can return to the agent.</p>`);
}

export function expiredPage(): string {
  return shell(`<h1 style="font-size:1.4rem">Already resumed or expired</h1>` +
    `<p style="color:#444">Nothing more to do here.</p>`);
}
