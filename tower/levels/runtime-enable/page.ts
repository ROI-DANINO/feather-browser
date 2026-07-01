// tower/levels/runtime-enable/page.ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { FastifyInstance } from "fastify";

// The vendored in-page probe (MIT, see ./VENDORED.md). Read once at module load and inlined into the
// served page so the MEASURED browser executes it. Resolved from THIS module's dir so it works from
// the source tree and from any build layout (mirrors server.ts's __dirname use).
const DETECTOR_JS = readFileSync(join(__dirname, "detector.js"), "utf8");

/** Escape a string for safe interpolation into HTML text and double-quoted attribute contexts. */
function htmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Server-render the challenge page for one run. The nonce is injected server-side (HTML-escaped) so
 * it is visible/attestable in the served HTML (the §6.2 hardening: the real nonce is rendered at GET
 * time). The inlined detector still reads the nonce from `location.search` at report time, per its
 * vendored contract — this injection is for provenance/hardening, not the detector's source of truth.
 */
function renderPage(nonce: string): string {
  const safeNonce = htmlEscape(nonce);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="tower-nonce" content="${safeNonce}">
<title>Tower · runtime-enable level</title>
</head>
<body>
<main>
<h1>Tower runtime-enable level</h1>
<p>Run nonce: <code id="nonce">${safeNonce}</code></p>
<p>This page measures whether the browser driving it has issued CDP <code>Runtime.enable</code>.
It self-reports to the same-origin sink; Tower never attaches to this browser.</p>
</main>
<script>
${DETECTOR_JS}
</script>
</body>
</html>`;
}

/**
 * Fastify plugin exposing GET /levels/runtime-enable?nonce=<nonce>. Register it on the same-origin
 * Tower instance (buildServer) so the detector's POST /sink/:nonce beacon is same-origin — no CORS,
 * no Private-Network-Access preflight (loopback→loopback). Export is a plain async plugin the server
 * (or a test) can `app.register(...)`.
 */
export async function runtimeEnablePage(app: FastifyInstance): Promise<void> {
  app.get("/levels/runtime-enable", async (req, reply) => {
    const nonce = (req.query as { nonce?: string }).nonce ?? "";
    return reply.code(200).type("text/html").send(renderPage(nonce));
  });
}

export default runtimeEnablePage;
