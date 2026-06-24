<!-- DRAFT — generated on the wrap-gap pass for Roi's review; verify every claim before committing. NOT yet committed. -->

# Security

Feather is a **local HTTP API that drives real, logged-in Chromium sessions** on your
machine. That is the whole point — and it is also the whole risk. Anything that can reach
this API and present its token can act as *you* inside every site your warmed profiles are
logged into. This document is an honest map of what protects you today, what does not yet,
and how to report a problem. It is written to match the rest of the repo: plain, specific,
and not flattering.

> The short version: Feather is loopback-only, token-gated (constant-time compare), guarded
> against the obvious browser-driven attacks, refuses to bind a non-loopback interface without
> an explicit opt-in, and stores credential-adjacent files owner-only. The remaining honest
> caveats: credentials at rest are protected by filesystem permissions only (no encryption), and a
> throwaway test credential is permanently in this public repo's git history. Read on for the detail.

## 1. Scope and threat model

Feather binds an HTTP control plane to `127.0.0.1` and hands out a bearer token. The control
plane can launch Chromium, navigate, click, type, read pages, take screenshots, and reuse
persistent profiles that are already logged in. The threat model is therefore **outsider-first**:
assume the attacker does not have your token and is trying to get one, or trying to make a
request *as if* they had one.

The actors we worry about, roughly in order:

- **A malicious web page in your own browser** trying to reach `http://127.0.0.1:<port>`.
  Loopback is *not* private from the browser — any page you visit can issue `fetch()` at
  `127.0.0.1`. The two real attacks here are **DNS rebinding** (a hostile DNS answer that
  points `evil.com` at `127.0.0.1` so the page's same-origin checks pass) and a **cross-origin
  CSRF drive-by** (a page POSTing to the control plane riding your ambient state). Both are
  addressed today — see §2.

- **A hostile or careless local user on a shared host.** Anyone who can read your files can
  read the control token (and therefore *is* you to Feather), and can read whatever the
  Chromium profiles and logs contain. On a single-user laptop this is a non-issue; on a
  shared box it is the dominant risk. Filesystem permissions are the only wall here: credential
  files and the profile/log directories are now owner-only `0700`/`0600` (§2), though at-rest
  contents stay unencrypted, a deliberate design boundary (§3).

- **The inherent risk of the API itself.** Even with perfect transport security, this is an
  API that drives a logged-in browser. A leaked token, a compromised agent, or a prompt-injected
  LLM that holds the token can do anything the human could do in those sessions. Feather adds a
  **capability gate** (§2) so the *most* dangerous operations need a fresh human approval each
  time, but ordinary navigation/click/type on already-warmed sessions is, by design, available
  to any caller holding the token.

**Out of scope (today):** we are not defending against an attacker who already has local
code execution as your user (they can read the token file and the profiles directly), against
a malicious *Chromium build* or a malicious site exploiting the browser engine itself, or
against network attackers — there is no remote surface to attack unless you deliberately
unbind from loopback, which now requires an explicit `FEATHER_ALLOW_NONLOOPBACK=1` opt-in (§2).

## 2. What protects you today

Every item below exists in the code as described. Nothing here is aspirational.

- **Loopback bind by default, and a non-loopback bind must be opted into.** The server defaults
  to `127.0.0.1` on an OS-assigned port, and `resolveHost()` (`src/config.ts`) now **refuses to
  start** if `FEATHER_HOST` is set to a non-loopback address unless `FEATHER_ALLOW_NONLOOPBACK=1`
  is also set. So a stray `FEATHER_HOST=0.0.0.0` can no longer silently expose the control plane
  to the network — it throws with an explicit message instead.

- **Bearer token in a header, never a cookie, compared in constant time.** Auth is a 256-bit
  random token (`src/transport/http.ts:26` — `randomBytes(32)`) that callers must send in the
  `X-Feather-Token` request header (`src/transport/middleware.ts`). Because it is a custom header
  and *not* a cookie, a browser will never attach it automatically to a cross-site request — so a
  drive-by page cannot ride your credentials the way it could with cookie auth. The compare uses a
  shared length-guarded `crypto.timingSafeEqual` helper (`constantTimeEqual`, `src/util/constant-time.ts`),
  so it leaks nothing through compare timing, and a missing or duplicated header is rejected, not
  trusted. The same helper backs every other bearer-secret / CSRF-nonce check (MFA `humanToken`, the MFA
  and capability-approval CSRF nonces), so they are constant-time too. The token is written to a file
  (`control-token`) created mode `0600`
  (`src/transport/http.ts:27`), owner-read/write only.

- **Origin/Host guard (anti DNS-rebinding + anti-CSRF).** A global `onRequest` hook runs
  before token auth and body parsing (`src/transport/http.ts:36`,
  `src/transport/middleware.ts:73`). It rejects (403) any request whose `Host` header is not a
  recognized loopback name — `127.0.0.1`, `localhost`, `::1`
  (`middleware.ts:14`, `:79`) — which kills DNS rebinding (the rebound page's `Host` is the
  attacker's domain). On state-changing methods (`POST/PUT/PATCH/DELETE`) it additionally
  rejects any cross-origin `Origin`/`Referer` (`middleware.ts:87–103`), which kills the
  cross-origin CSRF drive-by. JavaScript cannot forge the `Origin` header, so this check is
  load-bearing.

- **Capability gate for the most dangerous operations.** Three operations — `cdp-attach`,
  `vault-unlock`, `cookie-export` (`src/capability/grants.ts:15`) — are **off by default and
  never enabled by token presence alone**. They must be opted in by host configuration
  (`FEATHER_DANGEROUS_CAPABILITIES`, `src/capability/policy.ts:5,15`), and even then **each use
  needs a fresh human approval**: the agent requests a grant, a human approves it on a local
  page, and the grant is a single-use, TTL-bound (default 60s, `grants.ts:63`) nonce the agent
  *never holds* — the server redeems it internally by scope (`grants.ts:142`, `service.ts:84`).
  Grants are revoked on session close, shutdown, and when an MFA challenge opens
  (`grants.ts:166`, `service.ts:96`). Every grant lifecycle event is recorded — and the audit
  record carries the grant, never the nonce (`grants.ts:38`, `src/capability/audit.ts:9`).

- **MFA approval is anti-phishing by construction.** When a site demands a 2FA code, Feather
  pauses the agent and routes a human-facing local page. The bearer secret for that page (a
  256-bit `humanToken`, `src/mfa/manager.ts:48`) is **kept out of the agent/LLM-facing API**:
  the agent only ever receives a token-less URL (`src/commands/mfa-challenge.ts:15`,
  `manager.ts:84`). The notifier interface now splits the two URLs by channel trust
  (`MfaNotifyUrls`, `src/mfa/types.ts`): the **console** receives only the token-less `agentUrl`
  (`ConsoleNotifier`, `src/mfa/notifier.ts`), so the live bearer token no longer lands on stdout;
  only a private channel (Telegram) carries the token-bearing `humanUrl`. Before Feather types a
  real code into the page, it re-checks that the page
  **origin has not changed** since the challenge was created (`manager.ts:196–203`) — so a code
  cannot be typed into a page that navigated to an attacker origin mid-challenge. The local form
  also carries a per-render CSRF nonce verified on submit (`manager.ts:103–117`), as
  defense-in-depth atop the global Origin/Host guard.

- **Credential redaction in logs.** Proxy credentials and URL userinfo/query strings are
  scrubbed before they reach logs or API responses: `redactProxy` reports only
  `hasCredentials: boolean` (`src/logs/redact.ts:3`) and `redactUrl` strips username, password,
  query, and fragment from any URL (`src/logs/redact.ts:11`). The README's "automatic credential
  redaction" claim is backed by this code (and a proxy-redaction integration test).

- **Owner-only permissions on credential-adjacent files.** Directories holding warmed profiles,
  identity records, session/audit logs, and the control token are created `0700`, and those files
  `0600` — owner-read/write only (`src/fs-layout.ts`, `src/capability/audit.ts`, `src/logs/logger.ts`,
  `src/identity/store.ts`, `src/transport/http.ts`). The **warmed-profile directory itself** — the
  actual cookie jar Chromium writes login state into — is created `0700` on its own inode
  (`src/sessions/manager.ts`), not just protected by an ancestor. On-demand debug bundles
  (network/console captures, manifest) are also written `0700`/`0600` (`src/debug/capture.ts`,
  `src/debug/bundle.ts`). `0700`/`0600` have no group/other bits, so the umask cannot loosen them.

- **MFA resolve banner keeps the token off the watched page.** When a site demands a 2FA code, Feather
  can show an in-browser banner whose button carries **no token and makes no network call** — it sets a
  DOM flag that Feather polls over CDP, then opens the token-bearing resolve form in a new tab
  **itself** (`src/mfa/resolve-banner.ts`). The watched (possibly hostile) page never sees the bearer
  token, and a solo operator can resolve MFA locally without configuring a private channel.

## 3. Honest residuals — real gaps, no airtight claims

This section is deliberately blunt. Feather is **not** airtight, and the items below are the
reasons. The Phase-1 hardening (constant-time auth and **all** bearer-secret/CSRF-nonce compares,
non-loopback gating, MFA console token leak, owner-only permissions including debug bundles) is
**done** and described in §2; what remains is below.

- **Credentials at rest are plaintext, protected by filesystem permissions only.** This is a
  design boundary, not a bug, but state it plainly: Feather does not encrypt credential material
  at rest. Logged-in state lives inside the **Chromium profile directories** (cookies, tokens,
  saved session state) on disk; the identity JSON records (`src/identity/types.ts`,
  `src/identity/store.ts`) hold metadata and an optional dormant `vaultRef`, not the secrets
  themselves, but the *warmed profiles they point at* are the live credential jar. The only thing
  standing between those profiles and another local user is the filesystem. There is no vault
  encryption in the current code path (the `vaultRef` keyring locator is "ignored at runtime in
  5a" per `src/identity/types.ts:23`). Treat the machine running Feather as holding live,
  unencrypted access to every warmed account.

- **A throwaway test credential is permanently in this public repo's git history.** *(Accepted,
  low blast radius.)* During earlier testing, a scratch Instagram test password was committed to
  this open repository. It was redacted from the **working tree** (commit `c830bcb`,
  `[REDACTED-PW]`) but **working-tree redaction is not remediation — git history still carries
  it**, and the repo is public, so the value should be considered already public. The accepted
  position: it is a disposable test-only account credential with no access to anything that
  matters, so the blast radius is low; a full history rewrite + force-push + rotation was
  recorded as the remediation but is not a blocker. **Do not commit real credentials to this
  repo** — there is no secret-scrubbing safety net here.

None of the above should be read as "Feather is broken." It should be read as: Feather is a
loopback, token-gated control plane (constant-time secret compares, non-loopback bind gated, owner-only
credential files) with a working capability gate and anti-phishing MFA, whose two remaining residuals
are a deliberate design boundary (plaintext at rest) and an accepted, low-blast-radius history leak —
and whose at-rest secrets are only as safe as the machine they sit on.

## 4. Reporting a vulnerability

If you find a security issue in Feather, please report it privately rather than opening a public
issue, so it can be fixed before it is widely known.

<!-- TODO(Roi): fill in a real contact before publishing — e.g. a security email, a GitHub
     private vulnerability-reporting link, or a PGP key. -->
**Contact:** _<add a security contact here — e.g. `security@…` or GitHub private advisory>_

Please include: what you found, how to reproduce it, and (if known) the affected file/line. We
will acknowledge the report, work on a fix, and credit you if you would like. Given the project's
stage (early, open-source, single-maintainer), please allow reasonable time for a response before
any public disclosure.
