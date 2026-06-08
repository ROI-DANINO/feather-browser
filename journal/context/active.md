# Active - startup pointer

This file is the short live pointer for `/start`. Full phase/session map -> `ROADMAP.md` (now a thin
index) + `docs/sessions/<id>.md`; operational checklist -> `journal/ops/tasks.md`; machine pointer ->
`journal/ops/phase.md`.

## Current pointer

- **Current phase:** Phase 4a — now framed for humans as **Feather v1** (front door: `feather.md`).
- **Just completed (2026-06-08):** **v1→v2→v3 roadmap restructure + open-source doctrine.** Roi was
  confused about what he's building; we re-grounded the whole product into three versions he approved,
  wrote `feather.md` + `docs/roadmap/{v1,v2,v3}.md`, and closed the doctrine deliverable as
  `adr-0011`. Closeout: `journal/ops/sessions/v1-v2-v3-roadmap-doctrine-20260608-0355.md`.
- **THE NEXT ACTION IS A TEST, NOT PLANNING — the v1 Instagram test:**
  1. Roi hand-starts a **throwaway Instagram** on the **scratch profile** (warm via throwaway Google;
     no phone needed). Collaborative: agent fills/navigates, Roi solves CAPTCHA + does Gmail verify,
     agent resumes (a manual dry-run of the v2 MFA Handler).
  2. An agent (Claude can be the first, driving Feather's local HTTP API) runs a smoke test —
     "open Instagram, scroll the feed, describe the first 3 posts" — then a Social Research errand
     (open a public profile → read visible comments → summarize).
  - **Pass** = stealthy enough; **flag** = v2 stealth hardening is the real next job (fallback: v2
    creates its own LinkedIn). Signup is IG's highest-scrutiny moment — a flag *there* ≠ Feather failed.
- **Then:** `Session 4a.8 — Markdown snapshot extraction` (port Crawl4AI natively) — the first v1 "Port".
- **Doctrine (now recorded, `adr-0011`):** build native by default; buy a package only for
  hard/fast-moving/security-critical (rare); expose-to-external = v3/5e (governed by `adr-0006`).
  Open-source repos = recipe books consulted per-feature. **4a.7 moved to v3/5e** (not deleted).
- **Version→phase map:** v1 = Phase 4a; v2 = Phase 5.0 + 5a/5b/5d; v3 = Phase 4b + 5e.

## What changed in 4a.6b (read if resuming the re-sequencing thread)

- **New ADR:** `docs/specs/adr-0010-local-control-plane-capability-model.md` (CANDIDATE) — three
  privilege tiers, capability-grant primitive, global `Origin`/`Host` hook, session-hold primitive.
- **4a.7 re-scoped:** cold-profile interop proof now; warmed attach -> Phase 5c behind the gate.
- **Phase 5 spine re-ordered:** `capability gate (5.0.0) -> Identity (5a) -> MFA (5b) -> warmed CDP
  (5c) -> Stealth (5d, last) -> Agent Runtime (5e)`. Renumbering map + dependency graph in `ROADMAP.md`.
- **Two dependency-breaking decisions** (why the order is possible): the session-hold primitive
  replaces MFA's `setStealthMode` (frees Stealth to be last); Identity stores stealth/MFA policy as
  opaque/versioned refs, not concrete imports (frees Identity to be first).
- **Roadmap split (council Q1):** `ROADMAP.md` is now a thin index; session bodies live in
  `docs/sessions/`; completed-session detail stays in git + `journal/ops/sessions/`.

## Files to read next (for the v1 Instagram test)

- `feather.md` (front door) + `docs/roadmap/v1.md` (the test is written in here)
- `docs/specs/adr-0011-open-source-consumption-doctrine.md` (the doctrine just recorded)
- For driving Feather: `README.md` ("For AI agents"), `docs/api-reference.md`, `endpoint.json` at runtime
- Demo/continuity reference (warm-profile flow): `scripts/demo/hero-chatgpt-gmail.ts`, `scripts/demo/continuity.ts`

## Blockers / notes

- **No blockers for the test itself** — it needs Roi to hand-start the throwaway IG (scratch profile,
  warm Google), then an agent drives Feather. The scratch profile is a throwaway by design, so we can
  test agent-driving *before* the v2 safety gate exists.
- `journal/raw/_inbox/` is clear (README only).

## Recent completed context

- **v1→v2→v3 restructure DONE (2026-06-08):** `feather.md` + `docs/roadmap/{v1,v2,v3}.md`; `ROADMAP.md`
  is now the execution engine-room behind them; doctrine recorded as `adr-0011`; 4a.7 moved to v3/5e.
- **4a.9 DONE:** demo recorded (28s, 1.25x), in README, pushed.
- Agent Browsing Stack specs complete (Stealth, MFA, Identity); these are **v2**.
- Open-source integration research complete; dispositions now locked in `adr-0011` + `feather.md`.
