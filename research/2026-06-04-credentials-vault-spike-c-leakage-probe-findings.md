# Spike C — Leakage Probe Findings (evidence, not assumptions)

Date: 2026-06-04
Context: ADR-0008 (CredentialsVault candidate) validation gate, Spike C.
Method: throwaway probe drove a real `chromium-headless-shell` session (Playwright 1.60)
through Feather's surfaces with **three distinct canaries**, one per entry vector, for clean
attribution. Local hermetic HTTP fixture, no network, no real creds.

- `C_PW` — typed into a `type=password` input, submitted via POST (the realistic autofill path)
- `C_URL` — carried in a URL query string (GET)
- `C_VIS` — rendered as visible body text (POST, echoed back)

## Result matrix (HIT = canary found in that surface)

| Surface | C_PW (password POST) | C_URL (url query) | C_VIS (visible text) |
|---|---|---|---|
| Feather JSONL session log (`logs/sessions/<id>.jsonl`) | — | **HIT** | — |
| `network-summary.jsonl` | — | **HIT** | — |
| `console.jsonl` / `errors.jsonl` | — | — | — |
| `commands.jsonl` | (HIT — probe-seeded only*) | — | — |
| Screenshot PNGs (text scan) | — | n/a | — (but VISUALLY present) |
| `trace.zip` | **HIT ×3 mechanisms** | **HIT** | **HIT** |

\* `commands.jsonl` only matched because the probe explicitly recorded the secret via
`recordCommand`. Real leakage there depends entirely on what a handler chooses to record →
it's a discipline/policy surface, not an automatic leak.

## Findings (what the evidence actually shows)

1. **`trace.zip` is the worst surface, and it leaks secrets that were never on screen.**
   The password leaked **three independent ways**: (a) the `fill()` **action parameter**
   recorded verbatim (`"value":"CANARY-PW-…"`), (b) an action **log line**
   (`fill("CANARY-PW-…")`), and (c) the **POST body** stored as a `.dat` resource
   (`pw=CANARY-PW-…`). Plus DOM `frame-snapshot`s and JPEG screenshots. A trace is therefore
   closer to a **keylogger of automation arguments** than a screen recording — redacting one
   spot cannot make it safe. → Mitigation must be *don't trace credential sessions* (or scrub
   action args + post bodies), not "accept the trace as capture-by-design."

2. **Feather's own JSONL session log leaks URL-borne secrets — fixable now.** `TAB_UPDATED`
   logs `data.url` raw (`src/sessions/manager.ts:159`). `redactUrl()` would NOT help: it strips
   only userinfo (`user:pass@`), not query strings. A secret in a query param lands in the log.

3. **`network-summary.jsonl` records `request.url()` only — confirmed.** It leaked `C_URL` (the
   URL) but NOT `C_PW`/`C_VIS` (POST bodies), exactly as reading `src/debug/capture.ts`
   predicted. Body-borne secrets are safe from `network-summary`; URL-borne ones are not.

4. **A `type=password` field gives the observability layer ZERO protection.** Masking is purely
   visual (dots in the PNG). The real value flowed in plaintext through the POST body, the
   `fill()` action param, and the trace. "It's a password field" is not a mitigation.

5. **Screenshots leak visually but are invisible to a text scan — proven.** `C_VIS` is rendered
   on screen in `echo-visible.png`, yet `strings | grep` finds nothing (it's pixels). The text
   harness has a real, named blind spot on images → handle by **policy** (don't screenshot
   sensitive sessions), not detection. OCR is out of scope.

## Priors this corrected (the point of doing it)

- ❌ I assumed a "real local POST" would make the secret leak into `network-summary` — **wrong**:
  `network-summary` never records POST bodies. Only the URL.
- ❓ I was unsure whether the trace contained the typed value — **confirmed YES**, and via the
  `fill()` action param, not just the DOM snapshot. Worse than expected.
- ✅ Confirmed: password screenshots are masked AND text-invisible; image leak detection needs
  OCR or policy.

## What this means for the harness design

- **Hard-fail (clean-tier) surfaces** — must never contain a secret, all fixable in our code:
  Feather JSONL session log, `network-summary.jsonl`, `console.jsonl`, `errors.jsonl`,
  `manifest.json`. The URL-logging leak (finding 2/3) is the first real bug to fix here.
- **`trace.zip`** is NOT merely "capture-by-design." It captures secrets never shown on screen.
  Treat as: **off by default for credential sessions**; if ever enabled, action-arg + post-body
  scrubbing is mandatory. The harness should scan it and report, but the *fix* is policy.
- **Screenshots / trace JPEGs**: visual-only leak, undetectable by text scan → policy, documented
  blind spot. Not a detection target for the harness.
- The reusable assertion should scan the clean-tier surfaces and **fail hard**; scan trace/images
  and **report** (with the explicit caveat that image text is undetectable).
