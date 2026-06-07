# Council Design Review — Roadmap, OSS Integration, MFA + Identity Plans

**Date:** 2026-06-07
**Status:** Review complete — findings recorded; no implementation done
**Reviewed:** `ROADMAP.md` (session-based rebase), `research/2026-06-07-open-source-integration-research.md`,
`docs/specs/2026-06-07-mfa-handler-{design,plan}.md`, `docs/specs/2026-06-07-identity-model-{design,plan}.md`
**Panel (5 models, independent):** Gemini 3.1 Pro (CLI), Grok 4.3 (OpenRouter), DeepSeek-R1
(OpenRouter), Claude Opus 4.8 (subagent, read live code), GPT-5.5 (OpenRouter).
**Prompt brief used:** archived intent in this file; 17 numbered questions (Q1–Q17) spanning roadmap,
OSS, MFA, identity, and cross-cutting risk.

> These are **spec/design-level** findings to fold into the plans before implementation. Nothing here
> was implemented. `research/` is not auto-loaded at `/start`; read on demand.

---

## Root cause (5/5 unanimous)

**Feather is sequencing the highest-privilege surfaces (CDP attach, unauthenticated MFA routes,
warmed credentials on disk) *before* the safety machinery meant to govern them.** Reverse it:
**capability/security model first, interop *through* that model.** A warmed Chromium profile is
effectively a bearer-credential vault; CDP, local HTTP routes, and the MFA helper page are all
high-value control planes over that vault.

---

## Unanimous findings

1. **CDP/WS exposure (Session 4a.7) before the safety gate is a sequencing error.** CDP is root
   access to the session: an attached client can `Network.getCookies` / `Storage.getCookies` /
   `Runtime.evaluate` and read raw session tokens directly — bypassing the "agents never see raw
   credentials" thesis. Fix: don't expose CDP on warmed profiles by default. Split 4a.7 into
   **(a) cold/throwaway-profile interop proof now** and **(b) warmed attach behind Phase 5.0**
   (capability grant + one-time token + TTL + audit + revoke on MFA/close). If interop is needed,
   put a **filtering proxy** in front that strips `Network`/`Storage` domains (which needs the gate
   built first anyway).

2. **Unauthenticated MFA local routes are the worst concrete hole (Q7).** `GET /v1/mfa/:id` and
   `POST /v1/mfa/:id/submit` have no auth, on the same server as the warmed browser. Opus verified
   the codebase has **no global CORS/Origin hook** (only `injectRequestId`), so "no auth" is literal.
   Killer: **CSRF drive-by** — during an MFA pause the warmed browser sits on the untrusted
   authenticating site, which can `fetch(127.0.0.1/v1/mfa/<id>/submit,{mode:"no-cors"})` (no
   preflight, lands anyway) to forge a code or flip the session back to `secure`. Fix:
   `challengeId` = 256-bit CSPRNG **bearer token** (not the only id); add a separate single-use
   `humanToken` in the URL; strict `Origin`/`Referer`/`Host` validation (kills DNS-rebinding);
   per-page CSRF nonce; strict CSP, no external resources. **Decide in the spec before code.**

3. **"Feather types the code so the agent never sees it" is a narrow boundary, not the security
   boundary (Q10).** The same agent owns the authenticated browser afterward. What it legitimately
   defends: the **reusable secret** (TOTP seed / single-use code never enters agent-readable space,
   logs, or LLM context) and the **human approval gate**. Sell it as that.

4. **MFA↔Stealth coupling is wrong and racy (Q8).** MFA create flips `setStealthMode("assisted")`;
   resolve/expire flips back. Concurrent challenges share one boolean → B resolving flips the session
   to `secure` while A still pending. A closed session leaves a `setTimeout` firing into a dead page.
   Gemini: dropping stealth mid-login **trips anti-bot behavioral detection**. Fix: keep MFA state
   orthogonal — a **session-hold primitive** (`reason: "mfa" | "human-approval" | "cdp-attach" |
   "shutdown"`); MFA *creates a hold*, the policy layer *observes* holds and decides behavior; never
   let MFA toggle stealth directly. Refcount pending challenges ("secure only at zero pending").

5. **In-memory + polling is the wrong model (Q9).** SSE bus already exists and `mfa.challenge.*`
   events are already emitted — the polling endpoint is redundant. `setTimeout` timers leak on
   restart/shutdown; check expiry on read/write, clear timers on resolve/cancel/session-close, cancel
   challenges on session close. In-memory itself is fine for MFA v1 (persisting codes would be worse).

6. **`identityId == workspaceId` strict 1:1:1 is premature narrowing (Q11).** Blocks obvious
   near-term needs: human + agent on one identity, profile rotation/re-warm without breaking the
   handle. Keep the stable named handle but store **separable fields** (`defaultWorkspaceId`,
   `defaultProfileId`) defaulting to the id; enforce "one active persistent session per profile" in
   code, not as the permanent domain model.

7. **The "clean" bus-decoupling for warm-status is a racy, semantically-invalid side-channel (Q13).**
   Opus's load-bearing discovery: the bus `IdentityManager` subscribes to is the **logging bus**
   (`src/logs/bus.ts`), not a domain bus — so a persistent state transition rides on a fire-and-forget
   log emission; gate/sample/change logging and warm-status silently breaks. GPT goes further:
   **closing a session does not mean warm** (failed login, logout, MFA abandoned, wrong account all
   get marked warm). Fix: warm-status must be **explicit** (human "Mark Warm" or a verified login
   signal) via a **direct awaited call** (`await identityManager.markWarm(id)`), not inferred from a
   close event on the log bus.

8. **Dormant `vaultRef` is a red herring; the warmed profile is the credential-at-rest store (Q14).**
   The profile dir already holds cookies / refresh tokens / localStorage / IndexedDB tokens / DBSC
   keys — live today. Disabling the password manager protects stored passwords, not session material.
   Prerequisites before warmed-profile operation is advertised broadly: restrictive FS permissions,
   no world-readable/cloud-synced profile paths, per-identity deletion, at-rest encryption
   (LUKS/encrypted home) or OS keyring via DBus (libsecret / GNOME Keyring / KWallet) with `vaultRef`
   as a **keyring locator, not a JSON path**, and the Phase-5.0 secret-leakage harness existing first.

9. **`ROADMAP.md` monolith will rot (Q1).** Completed sessions accumulate as dead weight; the
   "read before starting" path lists go stale silently. Suggested: keep `ROADMAP.md` as a thin index
   (phase + one-line status + dependency graph + security gates); move executable bodies to
   `docs/sessions/<id>.md`, archive on completion; hold lasting decisions in ADRs. *(Note: this pushes
   back on the 2026-06-07 monolithic rebase. Decision deferred to Roi — not changed here.)*

10. **Crawl4AI markdown port (Session 4a.8) is not highest-leverage (Q5).** Low-risk content-quality
    work; do it, but never ahead of the attach-security story.

11. **OSS license calls are sound (Q6) — the one unanimous green.** AGPL reference-only for Maxun is
    correct; the fingerprint npm deps (`fingerprint-generator`, `fingerprint-injector`,
    `idcac-playwright`) are independently licensed and safe — **verify each package's own LICENSE +
    postinstall/supply-chain posture**, and clean-room the Crawl4AI port (read the npm API, not the
    source) to keep the Apache port clean.

---

## Unique additions worth keeping

- **GPT — malicious-agent MFA phishing (sharpens Q10):** the challenge-create route accepts an
  agent-supplied `prompt` AND `target`. A compromised agent can navigate to `attacker.com`, create a
  challenge ("Enter your bank code"), point `target` at an attacker input, and wait for Feather to
  type the real code in. HTML-escaping does nothing. Fix: before typing, show the human the current
  **origin/URL + target + screenshot** ("Feather will type into `<origin>`") and **verify origin
  unchanged** since challenge creation; pause agent + suspend CDP/snapshot during the MFA flow.
- **GPT — naming overpromises:** `secure`/`assisted` mislead — `assisted` may be the *more* dangerous
  mode (human entering live secrets).
- **GPT — don't block on MCP:** ADR-0005/0006 defer tool selection to the MCP spec (2026-07-28), but
  internal capability/tool-surface design need not wait — MCP can be an adapter later.
- **Gemini — CDP proxy that filters `Network`/`Storage`** if Python interop is mandatory.

## Divergences (left open for Roi)

- **Build order.** Grok/DeepSeek: keep Stealth→MFA→Identity (Identity imports `StealthConfig`, so
  spike Stealth first). Gemini: reverse to Identity→MFA→Stealth (Stealth most complex/breakable).
  Opus & GPT reframe: the real root is the **safety/capability gate**, ahead of all three; Identity is
  the safe self-contained start but **don't pre-commit cross-module placeholder type contracts**.
- **Identity storage.** SQLite (Gemini, DeepSeek) vs. JSON + per-identity write mutex / version field,
  no DB yet (Opus, GPT). Either way: guard read-modify-write (lost-update) races.

---

## Agreed action list (for the next implementation pass — not done here)

1. Don't expose CDP on warmed profiles before the safety gate — split Session 4a.7
   (cold-profile demo now / warmed attach post-gate).
2. Capability-token + Origin/Host + CSRF-nonce the MFA local routes before any code.
3. Origin-verify the MFA target + show the human origin/target/screenshot before typing.
4. Replace MFA's direct `setStealthMode` toggle with a session-hold primitive; refcount holds.
5. Consume the existing SSE bus for MFA status; keep polling only as a fallback.
6. Break `identityId == workspaceId` into separable fields; enforce 1-session-per-profile in code.
7. Make warm-status explicit via a direct awaited call; stop inferring warm from a close event.
8. Treat the warmed profile as credential-at-rest (FS perms / at-rest encryption / OS keyring) —
   gate `vaultRef` activation on the safety gate, not just ADR-0008.

## Cross-references

- Roadmap sequencing flag: `ROADMAP.md` → Session 4a.7.
- Spec addenda: `docs/specs/2026-06-07-mfa-handler-design.md`,
  `docs/specs/2026-06-07-identity-model-design.md` (Security addendum sections).
- OSS context: `research/2026-06-07-open-source-integration-research.md`.
- Safety gate target: `ROADMAP.md` → Phase 5.0; `docs/specs/adr-0008-credentials-vault.md`.
