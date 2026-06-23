# Run Notes — compact phase-boundary decision/state log

Append-only. One short block per phase-boundary or durable decision. Newest at the bottom.

---

## 2026-06-23 — 5c reframed: native path IS the v2 spine's safety; raw-CDP attach → 5e

**Phase:** 4a / v2 security spine. **sub_phase:** `v2-spine-safety-build-complete-5c-reframed-native-not-cdp-attach`.

**Decision (Roi):** the v2 spine's *safety* is delivered by Feather's **native, credential-safe API**
(Safe tier) + the 5b MFA pause/`HUMAN_IN_CONTROL` brake — **not** by handing out raw CDP. Raw-CDP attach
is **interop, not a safety brick → deferred to 5e** (build only on real external-tool demand). The
welded filtering-proxy design (block Network/Storage → HttpOnly cookies safe; allow Runtime.evaluate;
origin-pin; single-connection; `cdp-attach` hold owns the socket; auto-kill-on-MFA) is **preserved for
rebuild, shelved not lost.** Gate A's `cdp-attach` door stays **built-but-dormant.**

**State:** v2 safety spine = **build-complete on paper** (5a Identity ✅ + native API ✅ + 5b MFA ✅).
**Only the live test remains** (5b proven with a MOCK browser only). **Next = the deferred testing
brainstorm** (warmed identity through a real login/MFA challenge, human-in-loop, brakes observed).

**Artifacts:** decision doc `docs/specs/2026-06-23-5c-native-vs-cdp-attach-decision.md`; ROADMAP +
tasks + browser-desk reconciled; blog `0021-the-door-i-didnt-build.md`; memory
`feather-security-first-framing`. This /stop consumed 3 pending /next entries (5a, v2-wrap, 5b).

---
## 2026-06-23 09:10 — Spine live test designed + planned; Finding #1 (identityId launch gap)

**Decision:** the deferred live-testing brainstorm is DONE → produced a design + 11-task
operate-by-hand run plan (`docs/specs/2026-06-23-spine-live-test-{design,plan}.md`, `b8e9745`/`f3c1ceb`).
Shape: agent drives a **throwaway-GitHub** login through a real **emailed device-code** wall; human
supplies password + code (2 touchpoints = the machinery under test); `HUMAN_IN_CONTROL` brake asserted;
inbox = scratch Gmail (`roionly9`); operate-by-hand, zero source changes. Anti-bot/fingerprint track is
SEPARATE (v2.5/5d) — its policy only governs target choice here.

**Finding #1 (caught before the browser opened):** the HTTP launch route can't bind a session to an
identity — `LaunchSchema` (`src/transport/routes.ts:49-61`) omits `identityId`, Zod strips it, so
`launchHandler` never sees it, though `SessionManager.launch` resolves `identityId → defaultWorkspaceId`.
Launch-by-identity is **unreachable from the API**; 5a tests hit the manager directly and missed it.

**State:** spine still build-complete-on-paper; live test NOT yet run (blocked on Roi creating the
GitHub throwaway). Server up→down this session; identity `gh-spine-test` persists cold.

**Next (Roi's call):** FIX FINDING #1 FIRST — add `identityId: z.string().optional()` to `LaunchSchema`
+ transport test (TDD) — THEN run plan Tasks 4–11. Run facts grounded: no `email` MfaType (use `sms`);
`ConsoleNotifier` prints the tokened MFA URL to server stdout; default MFA timeout 5min (bump via
`FEATHER_MFA_TIMEOUT_MS=600000`).

---

## 2026-06-23 ~15:20 — Spine SAFETY live test RAN → PARTIAL (Finding #1 fixed+proven)

**Finding #1 — FIXED (TDD, `4c75a1e`):** added `identityId: z.string().optional()` to `LaunchSchema`
(`src/transport/routes.ts`) + `LaunchInput`; launch-by-identity now reachable from the API. NOT caused
by the ponytail audit — `identityId` was never in routes.ts in git history (`git log -S` empty); an
original 5a gap (5a tested the manager directly). **Proven live this run:** launch envelope carried
`identityId`→resolved `workspaceId: gh-spine-test`.

**Live run (operate-by-hand, plan Tasks 2–11) → PARTIAL.** Throwaway GitHub `roionly9-byte` / scratch
Gmail, headed `chromium-headed-cdp`, session `ses_b8ccf08dfb`.
- **PROVEN LIVE:** native drive + agent never typed the password; `await-human` password handoff
  (`resumedBy:human`, ~80s); **brake #1 = `409 HUMAN_IN_CONTROL`** (agent navigate refused mid-pause);
  real login → `meta[name=user-login]=roionly9-byte`; identity `gh-spine-test` marked **warm** (v2).
- **NOT EXERCISED:** GitHub showed **no emailed device-code wall** to a new account from a fresh
  Chromium (same machine/IP) → 5b MFA half had no real challenge to bind to. Roi: bank PARTIAL.

**Findings:** **#2** plan-doc bug — `await-human` body is `reason` not `prompt` (`AwaitHumanSchema`);
the 400'd call registered no pause and briefly defeated the first brake check (navigate hit example.com,
recovered). Fixed in the plan. MFA-challenge body correctly uses `prompt`. **#3** GitHub didn't
challenge — env/target data point, not a Feather bug.

**State:** report+screenshot `docs/v2_wrap/spine-live-test/run-report.md`; both commits pushed
`origin/dev` (`0736824`). Scratch-profile `warm-session.ts` orphan killed; no Feather procs left.
Warmed `gh-spine-test` persists for deferred Phase 2.

**Next (Roi: resume testing):** run the **5b MFA LIVE-WALL test** against a target that *reliably*
2FA-walls a new-device login, or **pre-enable TOTP** so the wall is guaranteed (the missing piece —
5b is still mock-only). await-human=`reason`, mfa/challenge=`prompt` (both confirmed live).

---

## 2026-06-23 ~15:40 — v2 SAFETY SPINE PROVEN LIVE → PASS (Instagram run); v2 WRAPPED

**Run B — Instagram (PASS).** Sacrificial `scratch` IG (`roionly9`), headed session `ses_cedae15ddf`.
Agent drove login natively + typed username; **`await-human` handoff absorbed a genuinely hard real
wall** — password **+ 2 CAPTCHAs + an email "verify it's you" *link*** (human opened a 2nd Gmail tab to
click it) — while the **`HUMAN_IN_CONTROL` brake held**: agent `navigate`→`409` (`req_ca3cc56b`), and
**zero agent mutations** across ~12 `tab.created/updated/closed` events during the 4-min human window.
Resumed **logged in as `roionly9`** (`img[alt]="roionly9's profile picture"`). The spine's safety =
brake + human-in-loop; **both held live under a messy multi-tab wall** → PASS. (Run A GitHub stayed
PARTIAL — no wall appeared.)

**Roi's framing (confirmed):** the wait-for-human + brake working cleanly IS the pass — a real test
(it *could* have failed: IG could block, brake could leak, banner could die on tab-switch; none did).
The warmed account is a byproduct (Cookie-Mine fuel), not the goal.

**Two honest asterisks (recorded, not rounded up):** (1) **5b typed-code** path (Feather auto-typing a
relayed 6-digit code via the tokened page) is **built + mock-proven (`12ffa91`) but NOT live-exercised**
— no real site issued a *typed code* (GitHub gave no wall; IG gave CAPTCHA + a *link*). Owed nicety,
needs a TOTP/SMS-2FA-enabled account; NOT a blocker. (2) **Password recovered from git history** to
unblock (accepted throwaway; the "agent never holds the secret" property is the deferred vault gap).

**State:** report (both runs) `docs/v2_wrap/spine-live-test/run-report.md` + 2 screenshots. **v2 =
spine safe + PROVEN LIVE → WRAPPED.** Next thread is open: 5d Stealth · Phase 2 warmed step-up · 4b
shell. v2.5/5d (stealth, typed-code live proof, LinkedIn exit test) stays deferred.
