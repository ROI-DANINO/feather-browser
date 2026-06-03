# Handoff — 2026-06-03 (s3-currency-security)

## Where We Are

**On `dev`** (pushed `origin/dev` @ `ea0b34a`; `master` untouched @ `b278409`). **S3 — Currency &
Security is shipped.** The **Stabilization & Linux-Readiness program is functionally closed**
(S1✅ S2✅ S3✅). 137 unit + 33 integration green, typecheck clean, under **Fastify 5.8.5 +
Playwright 1.60.0**.

This session: resumed (S2 was done), picked S3, brainstormed → spec → plan → executed
research-first → reviewed → pushed.

## What Shipped (5 commits on dev)

- `fcfd2f6` S3 design spec · `15dedd0` implementation plan
- `2fb271e` **Fastify v4→v5 — ZERO source changes.** Every v5 breaking change was N/A: Zod
  validation (no Fastify `schema:` blocks), `listen()` already object-form, no
  `request.connection`/`hostname`/`getDefaultRoute`, DELETE callers send non-empty bodies.
- `f6daea2` **Playwright `^1.50→^1.60`** (latest stable). Bundled Chromium **148 unchanged** →
  measurement docs + system-Chromium spike stay valid, no re-run.
- `ea0b34a` **Security checkpoint.** Findings: `docs/specs/2026-06-03-s3-security-checkpoint-findings.md`.

## Key Decisions

- **S3 = one research-gated spec**, not split.
- **Probe-first:** validated `fastify-sse-v2` v5 compat in a throwaway branch (PASS: full suite +
  live SSE) BEFORE touching real code. Hand-rolled-SSE contingency defined but unused.
- **Playwright→latest = stealth** (current Chromium = camouflage), NOT weight. Weight =
  `FEATHER_CHROMIUM_PATH` (separate, deferred).
- **npm audit:** 5 vulns all **dev-only Vitest toolchain** (esbuild dev-server SSRF), pre-existing,
  zero runtime exposure → **accepted risk, NO forced `vitest@4`** (Roi-approved). Documented.
- **Stop for sudo** — new standing preference (saved to auto-memory).

## Next Concrete Action

**ROADMAP Phase 4 Step 0** — research + plan the **Visual Desktop Shell** (brainstorm first).
Candidates: Tauri/WebKitGTK vs GTK4-native; Wayland browser-surface embedding unresolved (must
prototype). Host-primary runtime (ADR-0004); Electron eliminated.

Alternatives (deferred, not blockers): `FEATHER_CHROMIUM_PATH` weight sprint (sudo-gated — Roi
runs `sudo dnf install chromium`), `DebugCapture`/trace observability sprint, or graduate `rnd`
(ADR-0006 + ROADMAP Phase-5 edit) to `dev`.

## Flags

- **STALE user-facing docs (fix early):** `README.md` + `PROGRESS.md` still say "Phase 3 / S1 in
  progress / 129+32." Reality: S1+S2+S3 done, program closed, 137+33, Fastify 5.8.5 + Playwright
  1.60. Outside `/stop` scope → not updated. Quick docs-reconciliation pass.
- **Check push state:** the `/stop` handoff commit may be local-only — `git status -sb`; if `dev`
  is ahead of `origin/dev`, push (policy: `dev` only).
- `FEATHER_HOST` can override bind to `0.0.0.0` — safe default `127.0.0.1`; add a guardrail/warning
  if Feather is ever packaged. (Findings doc.)
- Vitest-toolchain vulns reappear in any `npm audit`; the `vitest@4` deferral is recorded — don't
  re-triage from scratch.
- `DebugCapture` (`src/debug/capture.ts`) is still dead code (observability sprint's job).
