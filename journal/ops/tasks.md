# Current Tasks — Phase 4a  (= Feather v1)

Checklist only. Front door → `feather.md`; version roadmaps → `docs/roadmap/{v1,v2,v3}.md`;
execution index → `ROADMAP.md`; live pointer → `journal/context/active.md`.

**Next action = v1 leftover cleanup**, then **5a — Identity Model**. (Security leak triaged + accepted
as low-risk — unique throwaway, no history rewrite, rotation deferred to 5d. See Security section.)
Gate A is DONE end-to-end (A0 + A1 + proven mined-AND-used). The navigation-survivable banner AND a
new human-in-control guard shipped 2026-06-15 (`2c7773a`).

Latest (2026-06-15 04:46 STOP): **RESUME-BANNER FIX + HUMAN-IN-CONTROL GUARD SHIPPED** (`2c7773a`,
TDD, proven live on scratch). Banner re-injects on `domcontentloaded` (survives navigation); a pause
now refuses agent page-mutations with `HUMAN_IN_CONTROL` (409), reads allowed, page-scoped. Gates:
tsc clean, 366u, await-human integration 9/9. **⚠️ Roi flagged real TEST creds leaked to the remote
repo + git history → top next task (see Security below).** Prior history →
`journal/ops/archive/tasks-20260615-0446.md`.

## ✅ SECURITY — credentials in the remote repo — TRIAGED + ACCEPTED (Roi, 2026-06-15)

**Roi's decision: NO git-history rewrite / force-push; NO urgent rotation.** The IG password is a
**unique throwaway** (not reused on any real account), so the public leak can only ever burn one
rebuildable sacrificial asset. Leak accepted as low-risk. Working-tree password already redacted
(`[REDACTED-PW]`); usernames/email (`roionly9`, `feather_test_roi`) stay — just identifiers for a
throwaway. The agent-driven IG password-change is **re-filed under 5d** below (it's a meaningful
stealth probe only once Stealth 5d + MFA 5b exist; running it now would give muddy data).

<details><summary>Original scope (for the record — no longer an action item)</summary>

      - **The scratch IG password** — was in 3 files; redacted from the working tree 2026-06-15.
      - **`roionly9` / `roionly9@gmail.com`** — 47 hits across 24 files.
      - **`feather_test_roi`** (old IG) — 69 hits across 38 files.

</details>

- [ ] **(deferred → 5d) Rotate the IG password via the AGENT itself as a stealth probe.** Use the
            warmed `scratch` profile (its strongest stealth asset) to let Feather drive IG's
            password-change flow autonomously — doubling as remediation AND a real bot-footprint probe.
            Honest framing: Feather is NOT fully stealthy yet (Stealth Stack 5d + MFA Handler 5b
            unbuilt; no human-like input timing); expect IG to **challenge** (re-auth / email-SMS code),
            not necessarily block (detection ≠ blocking — cf. the Google security-alert-but-not-blocked
            data point 2026-06-15). **Design so rotation succeeds even if the stealth test "fails":**
            headed, Roi watching, agent drives observe→act → on any challenge it **hands off via
            await-human** (the navigation-survivable banner + human-in-control guard shipped this
            session are purpose-built for exactly this) → Roi clears it → agent continues. Record
            honestly: did IG challenge? at which step? did the handoff work? A clean failure-with-
            fallback = a passing test. NB: changing the password invalidates the mined cookies / logs
            out other sessions (fine — rotation is the goal). Evidence feeds 5d (stealth) + 5b (MFA).

---

## Feather v1 — "It runs errands for me" (Phase 4a)

- [x] **v1 BUILT AND PROVEN** — 4a.1–4a.10 + perception loop + showcase suites + daily-driver +
      Graphify + command layer. Detail: `journal/ops/archive/tasks-20260610-{1203,1243}.md`.
- [x] **v1-wrap evidence + comparison** — agent-driven run (`docs/v1_wrap/test_1/`) vs
      Claude-for-Chrome; meta-analysis + corrections register (`docs/v1_wrap/META-ANALYSIS.md`).
- [x] **v1-wrap gap fixes SHIPPED (2026-06-11)** — headed-CDP viewport honored; GET /tabs +
      best-effort newPageId; extract flat-shape/type-default/`value`; teardown ENOTEMPTY retry;
      per-action session log + GET /health; docs/skills truth pass (stale browserMode enum fixed).
      Plan: `docs/specs/2026-06-11-v1-wrap-gap-fixes-plan.md`.
- [x] **`/blog` v1 finale (2026-06-11)** — 4 owed lines folded into 2 entries: `0019` the 06-10
      testing-honesty trio + `0020` "Feather on Trial" finale. `_pending.md` Owed cleared.
      (Committed `af83a65` on task branch, reconciled to `dev` 2026-06-11; the branch's temporary
      superpowers-vendor commit was dropped — Roi's call.)

### Open v1 leftovers (small / optional)

- [ ] Prune duplicate "Rosh Hashana" Sep-12 events on scratch Google (Feather H1 + C4C H1).
- [x] **H3 viewport acceptance check — RUN 2026-06-15; counterfactual FALSE on niri.** Drove IG
      logged-out in a headed `chromium-headed-cdp` session and measured the CSS layout width from
      observe box coords. Requesting `1280×800` → max content right-edge **604 CSS px** (IG mobile
      layout); requesting `2560×1600` → **identical 604 px**. Since doubling the requested size
      changed nothing, `--window-size` is being **ignored** — Roi's **niri** (scrolling tiling
      Wayland WM) tiles the Chromium window to its column width, so the effective viewport is ~700px
      regardless of request → sites serve mobile. **Not HiDPI, not a Feather bug — a tiling-WM
      constraint.** So the earlier "viewport silently ignored" fix (`--window-size`) only helps on a
      floating/stacking WM; it cannot force a desktop viewport under niri. → see the 5d note below
      for the durable fix.
- [x] **Remove the retired scripted `run_h3` from `examples/showcase.sh` — DONE 2026-06-15.** Deleted
      the function + `HARD` array entry + stale `H1-H4` header comment; `bash -n` clean. Agent-driven
      is the H3 benchmark now (Roi 2026-06-11).
- [ ] **(kind,name) overlay-identity mutation watch-item** — code change only on real-world failure.
- [x] **Navigation-survivable resume banner — SHIPPED (2026-06-15, `2c7773a`).** Re-injects on
      `domcontentloaded` (not raw `framenavigated` — needs `document.body` present) so the banner
      follows the human across navigations. TDD; proven live on scratch (Hebrew Google login).
- [x] **Human-in-control guard — SHIPPED (2026-06-15, `2c7773a`).** Found live (an automated navigate
      yanked Roi out mid-login). While a pause is active, agent page-mutations (navigate/click/type/
      press/select-option; dismiss via click) are refused with `HUMAN_IN_CONTROL` (409); reads allowed;
      page-scoped. `pause-registry` tracks `pageId` + `isPagePaused`/`assertPageNotPaused`.
- [ ] **"Agent feels the resume instantly" — NO CODE NEEDED (note).** Feather already emits it: the
      blocking `await-human` call returns on resume + a `human.pause.resolved` SSE event. The /next
      "felt slow" was the test harness writing to a file without polling; an integrated agent feels it.
- [~] **pi_agency ⇄ Feather thin integration — PARKED.** Resume only if Roi pulls it forward.

## Feather v2 — "It survives the scary sites, safely"  (`docs/roadmap/v2.md`)

Security-first spine: `gate → Identity → MFA → warmed attach → Stealth last`. Do not start before Gate A.

- [ ] **5.0.0 — Capability/safety gate** (implements ADR-0010) — Gate A — **IN PROGRESS.**
      Phase boundary done (planning-first). ADR-0010 **ACCEPTED** (#3) + Gate A design
      (`docs/specs/2026-06-11-gate-a-capability-system-design.md`); split into A0 + A1.
      - [x] **A0 — transport hardening** — global `Origin`/`Referer`/`Host` guard SHIPPED
            (plan #4, code #5, CI green, merged to `dev`). `FORBIDDEN_HOST`/`FORBIDDEN_ORIGIN`;
            `/resume` verified same-origin → R1. `src/transport/middleware.ts` `createOriginHostGuard`.
      - [~] **A1 — capability system** ← **IN PROGRESS** (simplified workflow: no PR-per-slice).
            Tiers + session-hold primitive + capability-grant registry + dangerous-mode policy + dual audit.
            - [x] **Slice 1 — session-hold primitive** (`src/capability/holds.ts`): `SessionHoldRegistry`,
                  refcounted holds w/ reason + teardown-on-release (revoke-teeth seam), observe/has/count,
                  `releaseAllForSession` revoke hammer. 11u, tsc clean. PURE INFRA, no live paths wired.
                  Reviewed clean + merged to dev 2026-06-11 (local takeover; remote branch deleted).
            - [x] **Slice 2 — capability-grant registry + state machine** (`src/capability/grants.ts`,
                  2026-06-11 local): opaque single-use nonce minted at approval → record
                  `{sessionId, capability, ttlMs, status}`; lazy TTL expiry (injectable clock);
                  `revokeAllForSession` hammer; redacted `onEvent` seam for the audit surfaces.
                  13u TDD red→green, suite 339/339, tsc clean. PURE INFRA, no live paths wired.
            - [x] **Slice 3 — approval page + policy + dual audit + cookie-export door** (2026-06-11
                  local; plan `docs/specs/2026-06-11-a1-slice3-plan.md`): `DangerousModePolicy`
                  (off-by-default, `FEATHER_DANGEROUS_CAPABILITIES`), append-only audit JSONL +
                  SSE bus, single-use humanToken/CSRF approval page (strict CSP), `consumeGranted`,
                  `CapabilityService` facade. Routes: `POST …/grants` (returns `{grant}` only),
                  `GET/POST /v1/approvals/:humanToken`, `POST …/cookies/export` (the gated demo door),
                  session-close→revoke. TDD +21u + 7i. **Gate A live + proven end-to-end.** Remaining
                  dangerous doors (CDP attach, vault) gated when built in 5c / ADR-0008.
            - [x] **Live-test Gate A — REAL use-case PROVEN (2026-06-15).** Re-warmed `scratch` Gmail via
                  human-in-the-loop login, mined 77 cookies THROUGH the gate (refuse→approve→export→
                  single-use; audit `requested→granted→used`), then a fresh empty browser opened
                  roionly9's inbox using ONLY those cookies = **mined AND used**, on Google (hard target).
                  Honest nuance: Google emailed a security alert but didn't invalidate the session
                  (detection≠blocking → 5d stealth input). Detail: `journal/context/next.md` 2026-06-15
                  03:30 entry. (Earlier disposable-github demo proved only the lock; this fills the box.)
      Body: `docs/sessions/5.0.0-capability-gate.md`. NB: the deferred `/evaluate` endpoint and
      batch endpoint land behind/after this gate (META-ANALYSIS ◇ items).
- [ ] **5.0.1 — MCP & tool-surface reconciliation** — owns the **Connector Registry** decision +
      the batch-endpoint call (input `research/2026-06-10-native-capabilities-router.md`)
- [ ] **5.0.2 — First-agent safety gate** — Gate B (input: C4C's per-origin allowlist + hard
      credential line, recorded in META-ANALYSIS §4.11)
- [x] **5a — Identity Model — SHIPPED 2026-06-15 (TDD).** Named, agent-attachable handle over a
      warmed profile + opaque stealth/MFA policy slots + dormant `vaultRef`. New `src/identity/`
      (types/store/manager) + `src/transport/identity-routes.ts` + `http-helpers.ts` (extracted to
      break a route import cycle). Six routes: `POST/GET/GET:id/DELETE:id /v1/identities`,
      `POST :id/warm`, `POST :id/mark-warm`. `LaunchSessionInput.identityId` resolves via an injected
      resolver seam (no import cycle); `SessionRecord.identityId` flows through. **Council S1–S5 baked
      in:** separable `defaultWorkspaceId`/`defaultProfileId` (S1); explicit `markWarm()` — NO
      close-bus inference (S2); opaque `stealthPolicy`/`mfaPolicy` versioned blobs, no cross-module
      imports (S3); per-identity write mutex + `version` field (S4); `disablePasswordManager` at
      create, 0600/0700 store perms, `vaultRef` redacted from all API responses + dormant (S5).
      Gates: tsc clean, **399 unit** (+33), identity integration 4/4, full integration 96/96 (the lone
      red is the pre-existing niri `attach-cdp` viewport test — env-specific, untouched by 5a), manual
      curl CRUD round-trip green. Plan: `docs/specs/2026-06-07-identity-model-plan.md`.
- [ ] **5b — MFA Handler** (plan: `docs/specs/2026-06-07-mfa-handler-plan.md`)
- [ ] **5d — Stealth Stack** (verify-not-spoof; plan: `docs/specs/2026-06-07-stealth-stack-plan.md`)
      NB: M2 is NOT usable as 5d evidence or regression test (cause undetermined — META-ANALYSIS §1);
      M1 cold-profile search walls remain the evidence.
      - [ ] **Headed-CDP viewport pinning (durable fix for the niri finding, 2026-06-15).** On a tiling
            WM (niri), `--window-size` is ignored → the render viewport is the tile width (~700px) →
            sites serve MOBILE layout. Durable fix = pin the render viewport via CDP
            `Emulation.setDeviceMetricsOverride` (e.g. 1280×800) in the `chromium-headed-cdp` launch
            path, **decoupled from the OS window geometry**. CAVEAT (why it lands in 5d): a
            window-vs-viewport mismatch is a mild fingerprint signal → gate behind a flag, default to
            the honest "match the window" behavior. Cheap user-side workaround meanwhile: a niri
            window rule to **float** the Feather Chromium window (size requests honored when floating).
- [ ] **Learn-your-behavior** + **active anti-bot self-detection**
- [ ] **Teach-a-workflow / action cache** (Anchor-inspired determinism layer)
- [ ] **Perception-output efficiency** (idea logged 2026-06-15 — NOT felt yet, do not build) —
      spend agent context efficiently (ADR-0005) by shrinking big perception payloads
      (snapshot / observe / extract). **Native kernel = return-less + expand-on-demand (progressive
      disclosure), NOT an ML compressor** — Feather's loop lets the agent re-query, so beat token
      bloat by *selection*, not squeezing. Trigger: a real errand choking on a giant snapshot.
      Neighbors: action cache / learn-your-behavior. Full intake (source: Headroom):
      `research/2026-06-15-headroom-integration-intake.md`.

## Feather v3 — "The polished product"  (`docs/roadmap/v3.md`)

- [ ] Visual Zen-style browser shell (Phase 4b; adr-0007/0009; gated on Casilda spike)
- [ ] **5e — Agent Runtime / ecosystem interop** — absorbs old **4a.7** (CDP attach), correctly last
- [ ] True perception / generalized workflows (north star)

## Parked / External Blockers

- [ ] Optional Gemini/OpenAI provider keys for future `claude-council` runs.
- [ ] Vault Spikes A/B remain frozen until explicitly pulled forward.
