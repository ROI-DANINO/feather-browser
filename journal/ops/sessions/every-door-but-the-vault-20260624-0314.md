# Session — Every Door But the Vault (2026-06-24 03:14)

**Phase:** v1-ship-and-adopt. **Outcome:** Phase 1 (Harden) shipped + local MFA resolve-banner.
Committed `06cd2e8`, pushed `origin/dev` (79cb5f8..06cd2e8). Blog 0023 written.

## Done this session

Started from a dynamic **wrap-gap workflow** (12 agents, adversarially verified): produced a verified
distance-to-wrap map, **resolved the v1-vs-v2 question** (it's a *v1 wrap*; the historically-"v2"
safety spine — Gate A + Identity + MFA — is already built and proven live, folded into v1), and drafted
`SECURITY.md` + `adr-0012`. Roi chose to build the **whole Phase 1 (1a + 1b) in one go**.

**Phase 1a — security fixes (TDD):**
- Constant-time token auth — `crypto.timingSafeEqual` + missing/empty/array-header tests (`middleware.ts`).
- Reject a non-loopback `FEATHER_HOST` unless `FEATHER_ALLOW_NONLOOPBACK=1` (`config.ts` `resolveHost()`).
- MFA bearer token off the console — notifier split into `{ agentUrl (token-less), humanUrl (token) }`;
  console gets agentUrl, Telegram keeps humanUrl (`mfa/types|notifier|manager`).
- Owner-only perms `0700`/`0600` on run/log/audit/session dirs (`fs-layout`, `audit`, `logger`).

**Phase 1b — test gaps:**
- `@vitest/coverage-v8` + per-area floor (capability/identity/mfa/transport); `npm run test:coverage`.
- `tests/integration/security/` schema-abuse fuzz surface (no 5xx, no proto-pollution) + index README + rule.
- Warmed-session reuse/persistence/isolation tests (the Cookie-Mine contract).
- `adr-0012` — at-rest plaintext (perms-only) intentional for v1.

**3-lens adversarial verify workflow → caught a MAJOR miss:** the warmed-profile **cookie jar itself**
(`src/sessions/manager.ts:132`) and the quarantine dir (`:388`) were still `0755` — the perms fix hit
the index dirs but missed the asset the whole product is built on. Fixed both to `0700`, TDD (the test
asserts the profile-dir leaf is owner-only). Two other findings disclosed + then fixed as the residuals.

**Local MFA resolve-banner (Roi's design; brainstormed → spec → TDD):**
`docs/specs/2026-06-24-mfa-resolve-banner-design.md`. A banner on the watched page whose button carries
**no token and makes no network call** — it sets a DOM flag; **Feather** polls it over CDP and opens the
token-bearing resolve tab **itself** (`context.newPage()` → `goto(humanUrl)`), so the watched (possibly
hostile) page never sees the bearer token. Closes the MFA-without-Telegram gap the console fix opened.
Pieces: `pause-banner.ts` (shared injector + resolve variant), `mfa/resolve-banner.ts`
(`startResolveBanner` + `makeResolveBannerController`), `mfa/manager.ts` (optional banner controller via
`setBannerController`, disposed in `release()`), wired in `routes.ts`. Integration-tested (real Chromium):
banner appears, token NOT in watched page, click → Feather opens the tab at the token URL, dispose removes it.

**The 2 residuals (TDD):**
- All bearer-secret / CSRF-nonce compares routed through one `constantTimeEqual` helper
  (`src/util/constant-time.ts`): `middleware` (refactored, removed local `tokenMatches`), MFA
  `verifyHumanToken`/`verifyCsrfNonce`, capability `service`/`approval`.
- Debug-bundle writes tightened to `0600`/`0700` (`debug/capture.ts`, `debug/bundle.ts`).

`SECURITY.md` reconciled to the shipped posture (the four 1a items + both residuals moved into "what
protects you"; §3 down to the two real residuals: plaintext-at-rest + the git-history leak).

**Coverage gotcha handled honestly:** `resolve-banner.ts` (Playwright, integration-tested) dragged the
unit `mfa` floor below threshold → excluded *that file* from the unit-coverage floor (not lowered),
with a comment. Floor passes again.

## Gate (final)
tsc clean · **471 unit** (coverage floor enforced, exit 0) · **164 integration / 1 skip / 1 pre-existing
attach-cdp viewport red** (niri tiling-WM ignores `--window-size`; unrelated to this work).

## Decisions
- v1 wrap confirmed; the "v2" safety spine is done and IS v1's foundation. Pick one axis (the reorientation already did).
- Build all of Phase 1 at once (Roi).
- MFA console-token-less stands (plan-of-record); the **local banner** is the solo channel (no Telegram needed).
- Banner security model: button carries no token; Feather opens the resolve tab over CDP (token never on the watched page).
- Do the 2 verifier-found residuals now (constant-time consolidation + debug perms).

## Left unfinished / NEXT
- **Phase 2 — Make it adoptable (OSS envelope).** Verified gaps from the wrap-gap workflow:
  - **README clone→fail blocker** (highest-leverage, xs): `npm install` doesn't fetch Chromium and the
    README never says `npx playwright install chromium` — a stranger's first session launch fails. CI
    proves the step is required.
  - `CONTRIBUTING.md` (absent); CI build **badge** in README (CI green-shaped, unbadged).
  - Declare HTTP API **v1** + a one-line stability promise (`/v1` prefix exists, no promise); action/MFA/
    grants endpoints lack runnable curl examples.
  - Surface the **success number** in README (8 PASS/2 PARTIAL lives only in `examples/showcase-output/`);
    note the "logged-in task" slice isn't stranger-reproducible (needs warmed Google/IG).
- **Phase 3 (LAST) — a NEW stronger demo:** record the H1 calendar errand (already PASSing) with
  `wf-recorder` (installed; the "blocked" status in 4a.9 / ROADMAP:150 is stale). + per-version done-line in `feather.md`.
- **Known deferred (not blockers):** credential-vault/secret-injection (IG run recovered pw from history);
  live MFA typed-code wall against a guaranteed-2FA target.

## Roi quotes
- "what can you do in the dynemic workflow to get us closer to a real v1 (i think its a v2 actualy) wrap?"
- "Build the whole Phase 1a+1b in one go"
- "before we wire telegram i want a banner that opens a new tab (if pressed) and in the new tab ill paste whatever expected in telegram, fix the 2 residuals, then commit and push. makes sense?"
- "feather already has this kind of thing just not the banner."
- "i trust you my boy"

## Pointers
- Plan of record: `docs/specs/2026-06-24-reorientation-and-roadmap-restructure.md`
- Banner design: `docs/specs/2026-06-24-mfa-resolve-banner-design.md`; at-rest: `docs/specs/adr-0012-at-rest-plaintext.md`
- Threat model: `SECURITY.md`. Commit: `06cd2e8`.
