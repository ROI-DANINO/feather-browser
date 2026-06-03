# Handoff — 2026-06-03 (s2-tab-design)

## Where We Are

**S2 brainstorm COMPLETE.** Design spec written + approved in-session. Branch: `dev`.

Spec: `docs/specs/2026-06-03-s2-tab-layer-observability-design.md`

## What's Next

Fresh session → **`/start`** → **Roi reviews the S2 spec** (review gate is still open — `/stop` was
called before he gave change/approve feedback on the written file) → on approval, invoke
**`superpowers:writing-plans`** → produce S2 implementation plan → execute (TDD).

## S2 Implementation Plan Scope (3 unblocked items)

1. **Dup-registration fix (prerequisite)** — idempotent `addPage` keyed on the `Page` object
   (reverse map `Page → pageId`); `openTab()` stops assigning its own id. Kills the two-IDs bug +
   the listener-vs-`openTab` race. Keep `TAB_OPENED` (intent) / `TAB_CREATED` (lifecycle) distinct.
2. **TAB_UPDATED — settled-only.** Add `TAB_UPDATED: "tab.updated"` to EVENTS + SSE
   `LIFECYCLE_EVENTS`. Main-frame `framenavigated` + `waitForLoadState("domcontentloaded")` +
   supersede guard; covers SPA `pushState`. Payload `{ pageId, url, title, loadState }`.
   Key reason for settle-wait: `page.title()` is unreliable at `framenavigated` time.
3. **Observability hardening** — `getPageInfoList()` per-page try/catch (best-effort
   `loadState: "unknown"`); trace e2e test (`debug.trace:true` → `trace.zip` non-empty).

## Deferred (follow-on, NOT in this plan)

- **`FEATHER_CHROMIUM_PATH`** — gated on `sudo dnf install chromium` (Fedora `updates` repo) +
  probe; then env var in `config.ts` + `executablePath` in `modes.ts`. Different theme (weight).

## Decisions This Session

- TAB_UPDATED = **settled-only** (no loading-spinner pulse; Phase-4 concern if ever wanted).
- Dup-reg fix = **idempotent addPage keyed on Page object**.
- **Keep TAB_OPENED/TAB_CREATED distinct** (intent/audit vs lifecycle) — not collapsing.
- **Defer FEATHER_CHROMIUM_PATH**; S2 plan = 3 items.
- **Stay strictly in roadmap order** (Roi: "I prefer to do things in order... Let's not skip ahead").

## Parked (Phase 5+)

- **Agent perception layer** — Actionable Tree / accessibility-tree extraction / numeric ID mapping
  (`click(ID)`/`type(ID)`). Captured to `research/2026-06-03-phase-5-agent-perception-layer-notes.md`
  with 5 claims flagged for a real research pass. Revisit at Phase 5 Step 0; validate against
  Playwright MCP's a11y-snapshot model first. ADR-0005 governs (tool choice after 2026-07-28).

## Program Structure

- **S1 — Foundation** ✅
- **Task 6b** ✅
- **S2 — Linux weight & observability** ← ACTIVE (brainstorm done; spec written; plan next)
- **S3 — Currency & security** (after S2)
- → ROADMAP Phase 4 Step 0

## Flags

- 7 untriaged research files still in `journal/raw/_inbox/` (2026-06-03-*) — deliberately left.

## How Roi Works

- Vibecoder, no technical background. Make the technical calls, explain plainly.
- Defers to recommendations — lead with one clear call, not equal-weight menus.
- Strict roadmap order; research-driven; security matters; one session per chunk.
