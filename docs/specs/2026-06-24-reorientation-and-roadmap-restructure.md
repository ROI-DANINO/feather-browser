# Reorientation & Roadmap Restructure — 2026-06-24

> **Status:** ACCEPTED (Roi, 2026-06-24). This doc is the single orientation source after a
> multi-angle audit (security, code-health, tests, roadmap-drift) + online research (bot-detection
> reality, browser-agent landscape). It supersedes the v1/v2/v3 × phase-letter sprawl as the
> *current* plan. Older roadmap docs remain as history; reconcile `ROADMAP.md` / `tasks.md` /
> `active.md` / `phase.md` to this.
>
> **Sequencing (Roi, 2026-06-24 /stop):** harden first (security wins → close test gaps) → then the
> OSS envelope → and a NEW, stronger demo LAST. Rationale: get the code solid and trustworthy before
> showing it off, and make the finale demo show Feather's *real* capabilities (the existing demo works
> but is basic). This reorders the phases below from the original draft.

## The decision (what we're aiming at)

**Target = HYBRID: personal errand-runner → narrow local-first/privacy OSS runtime.**
Dogfood Feather as *Roi's own* errand-runner to earn honest evidence, then wrap that **same engine**
for strangers on the one axis funded cloud rivals structurally cannot own: **local-first, private,
warmed REAL logins that never leave the machine.** Authentication / persistent warmed sessions is the
problem every competitor names as unsolved — and Feather is already built around it. That is the moat.

**Stealth = CUT / parked.** Confirmed by Roi. Reopen *only* if a real site we care about blocks a
warmed Feather session — and even then, *adopt a maintained engine* (patchright/nodriver-class),
don't hand-patch.

**Big vision (visual Zen shell + stealth-agent fleet) = deferred.** It competes with funded
specialists ($2k/mo stealth tier); not a near-term solo build.

## Why (the evidence, briefly)

- **The drift was real.** `phase.md` said `phase-4a` (v1) while the last ~9 days were v2.5/5d stealth.
  35 of 52 recent commits were docs/journal, not code; 9 spec docs in one day, several superseding
  same-week ones; `active.md` grew to 247 lines / 11 stacked "NOW" entries. The stale phase pointer is
  the mechanism that let autopilot run unseen.
- **Stealth is a treadmill.** Independent benchmark: `rebrowser`'s CDP/`Runtime.enable` patches (the
  exact thing 5d chased) scored **identical to vanilla Playwright on 31 real Cloudflare sites** — same
  5 blocked. Detector scores (sannysoft/Brotector/CreepJS) are a known *lower bound*, not real success.
- **The warmed session already wins.** An aged, real, logged-in account on a real consumer IP "looks
  identical to any other real user." The Cookie Mine is the product and is largely solved *by
  construction*. Chasing detector scores is orthogonal to it.
- **The work itself is good.** Build is clean (`tsc` 0 errors); 454 unit + 101 real-Chromium
  integration tests, security paths genuinely covered; the new credential code is well-architected.
  The problem was direction, not craft.

## What "done" means for v1 (finally checkable)

1. Leaked-credential posture handled (see Phase 0): account rotated/abandoned by Roi; commit-time guard live.
2. Code is **hardened first** — the security defense-in-depth fixes + the real test gaps are closed
   (see Phase 1) *before* the project is shown off.
3. A stranger on a clean Linux box: clone → start → run one real task in **~5 minutes** from the
   README alone (Phase 2).
4. OSS envelope present: 60-second README quickstart; `SECURITY.md` (local-API threat model,
   outsider-first); `CONTRIBUTING.md`; CI green with a build badge. (`LICENSE` already Apache-2.0.)
5. A **NEW, stronger hero demo** of a real logged-in errand is **recorded and published** — done LAST
   (Roi, 2026-06-24): the current demo works but is basic; the finale should show Feather's *real*
   capabilities. (`wf-recorder` is installed — the old "blocked" excuse was false.)
6. HTTP API declared **v1** with a one-line stability promise; every endpoint has a runnable example.
7. Phase docs all agree (`phase.md` / `AGENTS.md` / `feather.md`), and `feather.md` carries a
   one-sentence binary "done" line per version row.

## Restructured roadmap

| Phase | Goal | Done when |
|---|---|---|
| **0 — Stop the bleed** | Public repo safe from credential leaks | Roi rotates/abandons the `roionly9` account; commit-time secret guard installed (**done**, `.githooks/pre-commit`); history **not** scrubbed (Roi's call — throwaway, low blast radius) |
| **1 — Harden** (security wins + test gaps) | Code solid and trustworthy BEFORE showing it off | Defense-in-depth security fixes (non-loopback host opt-in; MFA token URL off console; `0700` run/log dirs; constant-time auth + missing-header tests); coverage tooling (`@vitest/coverage-v8`) + a floor on `capability`/`identity`/`mfa`/`transport`; one consolidated abuse/security test surface; warmed-session reuse/persistence/isolation tests; 3-line at-rest ADR ("plaintext, perms-only", intentional for v1) |
| **2 — Make it adoptable** (OSS envelope) | Stranger goes clone→success in minutes | 60-sec copy-paste README quickstart; `SECURITY.md` (loopback bind, bearer token in header not cookie, Origin/Host guard, honest residuals); `CONTRIBUTING.md`; CI green + build badge; API declared v1; published reproducible success number incl. one logged-in task |
| **3 — Show it off** (a NEW, stronger demo) | A finale demo that shows Feather's REAL capabilities | The current demo works but is basic — record & publish ONE strong hero demo of a real logged-in errand (`wf-recorder` installed), done LAST; one-line binary done-line per version in `feather.md` |
| **Later — Stealth & visual shell** | **PARKED — do not start** | Trigger to reopen = a real site we care about blocks a warmed Feather session (not a detector score). If reopened: adopt a maintained protocol-bypass engine; do not own a stealth layer |

## Execution order

> Order per Roi (2026-06-24 /stop): harden → adoptable → stronger demo last. **No history scrub**
> (account handled by Roi), guard added.

1. **(done)** Commit-time secret guard installed — `.githooks/pre-commit`: prefers `gitleaks` if
   installed, else a conservative key-shaped-secret scan. *Residual (accepted): the password stays in
   public git history forever, but only ever burns one dead throwaway.* Going forward, reference test
   creds by `vaultRef` only — never write a real credential into journals/docs.
2. **(done)** Phase docs made truthful + tracking files reconciled to this plan; `active.md` trimmed;
   old NOW stack & old tasks archived. Added the rule: *no session ships code for a phase ahead of
   `phase.md` without first updating `phase.md`.*
3. **(Roi, outside repo)** Rotate or abandon the `roionly9` account; treat any warmed cookies tied to
   it as untrusted and discard them. *(Small.)*
4. **Phase 1a — Security wins (defense-in-depth, from the audit):** write `SECURITY.md`'s threat model
   alongside the fixes — reject a non-loopback `FEATHER_HOST` unless an explicit opt-in is set; stop
   printing the live MFA bearer-token URL to console; set `0700` on run/log dirs; switch auth to
   `crypto.timingSafeEqual` + add the missing-header / empty / array-header tests. *(Medium.)*
5. **Phase 1b — Close the test gaps:** add `@vitest/coverage-v8` with a loose floor on the
   security-critical dirs; carve one `tests/integration/security/` surface (collect the scattered abuse
   tests + a few input-fuzz cases for agent-facing schemas); add warmed-session reuse/persistence/
   isolation tests; write the 3-line at-rest ADR. *(Medium.)*
6. **Phase 2 — OSS envelope:** 60-second README quickstart (clone → start → run one real task), add
   `CONTRIBUTING.md`, wire CI green with a build badge, confirm `examples/showcase.sh` works from a
   clean checkout, declare the API **v1**, publish a reproducible success number. *(Medium.)*
7. **Phase 3 — A NEW, stronger hero demo (LAST):** the current `npm run demo:hero` works but is basic.
   Design and record a stronger demo that shows Feather's *real* capabilities on a real logged-in
   errand with the already-installed `wf-recorder`; publish it. Add the per-version binary done-line in
   `feather.md`. *(Medium.)*
8. **(done)** Stealth cut — logged as a one-line park.

## Cut list (stop doing these)

- The entire stealth cat-and-mouse (Brotector/rebrowser/`Runtime.enable`, the 5d.x arc) — parked as one line.
- Doc churn — no fresh spec to supersede a same-week spec; edit the original or write one line. Watch the >2:1 docs:code ratio.
- Roadmap taxonomy sprawl — pick ONE axis (version OR phase letters); delete the renumbering-history map (it's in git); collapse 5d.1–5d.5 to a single "Stealth (later)" line; name "v2.5" as a real tier or kill it.
- `active.md` as an append-log — keep it to its own promised 2–3 entries.
- Don't add at-rest encryption for v1 — write a 3-line ADR that "plaintext, perms-only" is intentional.
- Don't over-document future-user deferrals — a one-line park, not a decision-doc + blog, for zero-demand features.

## Test strategy (from the tests audit)

**Have today (genuinely strong):** 454 unit + 101 real-Chromium integration + a measurement tier;
security paths covered (Origin/Host guard, capability gate, MFA anti-phishing, the real-registry
regression for the live HUMAN_IN_CONTROL bug, HTML-escape & secret-leak canaries, 0600/0700 perms).

**Real gaps:** no coverage measurement anywhere (true branch coverage of `capability`/`identity`/`mfa`/
`transport` unknown); auth uses non-constant-time `!==` and never tests the missing-header branch; abuse
tests are scattered (no single security gate, no input-fuzzing of agent-facing schemas); no clean-machine
stranger-reproducibility test; at-rest is plaintext-perms-only with no ADR saying so; measurement tier
excluded from CI (a 2× RAM regression ships green).

**Proposed (Phase 1):** add `@vitest/coverage-v8` + a loose floor on the security-critical dirs;
`crypto.timingSafeEqual` + the three missing auth-branch tests; one `tests/integration/security/`
surface + input-fuzz cases with a "new route ⇒ add an abuse test here" rule; one clean-machine
end-to-end test that doubles as the published success metric; the 3-line at-rest ADR + a canary
leak-scan over the identities dir; nightly (not hard-gated) measurement on wide tolerances.

## Open variables & residual risks

- **IP reality (Roi, 2026-06-24):** warmed sessions ride whatever WiFi/iPhone-hotspot Roi is on — all
  **real consumer IPs**, not datacenter proxies, so the stealth-cut stands. The one consequence of
  roaming IPs is more **"verify it's you" account challenges** (not bot detection) — already absorbed by
  the MFA pause + await-human handoff, which *reinforces* the Phase 1 durability/test work over stealth.
  Revisit only if Feather ever moves to datacenter proxies at scale.
- **History leak is permanent** (no scrub): the old throwaway password stays recoverable in public
  history. Accepted as low blast-radius. Don't write new credentials into the repo (the guard now helps).
- **"Narrow OSS" is a crowded field** (Steel 7.2k stars; vercel-labs/agent-browser ~37k stars, near
  identical observe→act-by-ref loop, but CLI/MCP-only — Feather's persistent HTTP service + warmed-session
  privacy is the differentiator). Onboarding parity (~60-second install) is a hard gate, not a nice-to-have.
- **Linux-first caps the adoption ceiling** vs cross-platform rivals — acceptable for now.
- **The local HTTP API controlling a logged-in browser is an inherent attack surface** (a malicious page
  could try to reach 127.0.0.1). The Origin/Host guard + bearer-token-in-header mitigate it; document the
  residual honestly in `SECURITY.md` rather than implying it's airtight.

## Sources

Audit + research run 2026-06-24 (8-agent workflow). Key external evidence: rebrowser==vanilla benchmark
(ianlpaterson.com), CreepJS lower-bound (undetectable.io), DataDome behavioral/ML model count
(datadome.co), warmed-account reputation (redaccs.com), landscape (apiscout.dev, firecrawl.dev,
github.com/vercel-labs/agent-browser, github.com/steel-dev/steel-browser), OSS-adoption bar
(OWASP CSRF cheat-sheet, README/docs best-practice guides).
