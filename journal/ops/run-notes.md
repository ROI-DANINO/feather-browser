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
