# Active - startup pointer

This file is the short live pointer for `/start`. Full phase/session map -> `ROADMAP.md` (now a thin
index) + `docs/sessions/<id>.md`; operational checklist -> `journal/ops/tasks.md`; machine pointer ->
`journal/ops/phase.md`.

## Current pointer

- **Current phase:** Phase 4a - Feather Core Open-Source Readiness And Public Proof.
- **Just completed:** `Session 4a.6b - Security & Capability Re-Sequencing` (planning only, no product
  code) + `Session 4a.10 - Social-research inbox triage`. Acted on the 2026-06-07 council review:
  reversed to "security model first, interop through it." All 4a.6b+4a.10 docs committed + pushed
  (`56bd985`, `dev == origin/dev`).
- **Current recommended session:** a **tight docs-only integration-doctrine reconciliation pass**
  (brainstorm-first), THEN `Session 4a.8 - Markdown snapshot extraction` (port Crawl4AI natively).
  **`Session 4a.7` (CDP attach) is PARKED / reframed** — it builds the "let outside tools drive Feather"
  door, which is the opposite of Roi's native-port philosophy. See the 2026-06-08 bridge in `next.md`.
- **Build-vs-buy doctrine (decided 2026-06-08, to be written up next session):** default = **port the
  recipe natively** (read source, rebuild in TS); **buy a native npm package only** for hard /
  fast-moving / security-critical work (e.g. Stealth fingerprint deps); **expose-to-external = deferred
  Phase 5e track.** Crawl4AI = port, Browser Use = port DOM bits, Maxun = AGPL reference-only, fingerprint
  npm = buy, OpenHands = undecided.
- **Next concrete action:** open a FRESH chat, paste the prompt in the 2026-06-08 `next.md` entry, run
  the doctrine pass (doctrine ADR + per-repo disposition table + re-tag 4a.7/4a.8/5d/5e), then 4a.8.
  Anti-perfectionism guardrails apply. **The real near-term deliverable remains the demo GIF/video for
  GitHub + LinkedIn (4a.9), blocked on a Wayland screen-recorder install.**
- **Task state:** roadmap split into thin index + `docs/sessions/`; ADR-0010 (capability model) written
  as CANDIDATE; Phase 5 spine re-ordered; MFA + Identity plan security tasks folded in.

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

## Files to read next (for 4a.7)

- `docs/sessions/4a.7-cdp-cold-profile-interop.md`
- `docs/specs/adr-0010-local-control-plane-capability-model.md`
- `research/2026-06-07-open-source-integration-research.md`
- `src/browser/modes.ts`, `src/sessions/session.ts`, `src/sessions/manager.ts`, `src/transport/routes.ts`

## Blockers / notes

- `journal/context/next.md` is the reset header only; no pending `/next` entries.
- LinkedIn debut recording (4a.9) still blocked on installing a Niri/Wayland screen recorder
  (Kooha or `wf-recorder`).
- `journal/raw/_inbox/` is clear (README only). The two social-research stubs were triaged (4a.10):
  consolidated into a `Proposed` Social Research Mode use-case seed in `journal/work/product/context.md`
  and archived to `journal/raw/archive/`.

## Recent completed context

- Agent Browsing Stack specs complete (Stealth, MFA, Identity); plan security tasks now folded in.
- Open-source integration research complete and folded into the roadmap sequence.
- Hero demo works: `npm run demo:hero`; recording still needs a screen recorder.
- Core open-source README and `examples/quickstart.sh` are in place.
