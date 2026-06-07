# Sessions

Executable work-session bodies. `ROADMAP.md` (repo root) is the **thin index** — phase status,
dependency graph, and security gates. This directory holds the detailed "read before starting →
tasks → definition of done" body for each **active or near-term** session.

## Conventions

- One file per session: `docs/sessions/<id>.md` (e.g. `4a.7-cdp-cold-profile-interop.md`).
- A session file is self-contained: a future agent can start by reading only the files it lists.
- **Completed sessions** are not kept here. Their history lives in `journal/ops/sessions/`,
  `journal/log.md`, and git history. The index marks them `✅ done` with a one-line outcome.
- **Phases that already have a detailed implementation plan** point to that plan instead of
  duplicating it here:
  - Stealth Stack → `docs/specs/2026-06-07-stealth-stack-plan.md`
  - MFA Handler → `docs/specs/2026-06-07-mfa-handler-plan.md`
  - Identity Model → `docs/specs/2026-06-07-identity-model-plan.md`
- **Phases whose body lives in an ADR** (the visual shell) point to the ADR
  (`adr-0007`, `adr-0009`) + `research/2026-06-05-phase4-gui-architecture-sketch.md`.
- **Lasting decisions go in ADRs**, not in session files.

## Current session files

| Session | Status | File |
|---|---|---|
| 4a.7 — CDP cold-profile interop proof | Next implementation session | [`4a.7-cdp-cold-profile-interop.md`](4a.7-cdp-cold-profile-interop.md) |
| 4a.8 — Markdown snapshot extraction | Pending | [`4a.8-markdown-snapshot.md`](4a.8-markdown-snapshot.md) |
| 4a.9 — LinkedIn debut recording | Blocked on screen recorder | [`4a.9-linkedin-debut.md`](4a.9-linkedin-debut.md) |
| 4a.10 — Social-research triage | Optional | [`4a.10-social-research-triage.md`](4a.10-social-research-triage.md) |
| 5.0.0 — Local control-plane & capability gate | First Phase 5 work (implements ADR-0010) | [`5.0.0-capability-gate.md`](5.0.0-capability-gate.md) |
| 5.0.1 — MCP & tool-surface reconciliation | Future | [`5.0.1-mcp-tool-surface.md`](5.0.1-mcp-tool-surface.md) |
| 5.0.2 — First-agent safety gate | Future | [`5.0.2-first-agent-safety-gate.md`](5.0.2-first-agent-safety-gate.md) |
