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
