# Specs

Approved specs and architecture decision records live here. ADRs are Accepted unless their
entry says otherwise — a 🚧 **CANDIDATE / NOT ACCEPTED** marker means the decision is recorded
direction pending validation, not a commitment.

## Architecture Decision Records

- [ADR-0001: Browser Foundation](adr-0001-browser-foundation.md)
- [ADR-0002: Headless Core Foundation](adr-0002-headless-core-foundation.md)
- [ADR-0003: Hybrid Browser with Shared Persistent Context (Cookie Mine)](adr-0003-hybrid-browser-shared-context.md)
- [ADR-0004: Runtime Target — Host-Primary, Flatpak Distribution, Podman Optional](adr-0004-runtime-target.md)
- [ADR-0005: Agentic North Star — Token & Context Efficiency (Constraint + Deferral)](adr-0005-agentic-north-star.md)
- [ADR-0006: Agent-Facing Interface Neutrality (Constraint + Deferral)](adr-0006-agent-interface-neutrality.md)
- [ADR-0007: Phase 4 Shell — Sequencing & Display Model (Stopgap First, Seamless Shell Deferred)](adr-0007-phase-4-shell-sequencing.md)
- [ADR-0008: Credentials Vault — Interface-First, Local-First](adr-0008-credentials-vault.md) — 🚧 **CANDIDATE, NOT ACCEPTED** (pending 3 spikes)
- [ADR-0009: Phase 4 Shell Stack — Tauri/WebKitGTK vs GTK4-Native](adr-0009-shell-stack.md) — 🚧 **CANDIDATE, NOT ACCEPTED** (recommendation; pending Casilda+Chromium spike — joint call)

## Design Specs

- [Phase 3 Branch Strategy & Stabilization](2026-05-31-phase3-branch-strategy-design.md)
- [Stabilization & Linux-Readiness Program](2026-06-03-stabilization-linux-readiness-design.md)
- [S2 — Tab-layer Correctness & Observability](2026-06-03-s2-tab-layer-observability-design.md)
- [S3 — Dependency Currency & Security Checkpoint](2026-06-03-s3-currency-security-design.md)
- [S3 Security Checkpoint — Findings](2026-06-03-s3-security-checkpoint-findings.md)
- [Blog System](2026-06-03-blog-system-design.md)
- [Repo Structure Cleanup — `journal/` Consolidation](2026-06-03-repo-structure-cleanup-design.md)

## Phase Plans and Checklists

- [Phase 2: Headless Core Prototype Plan](phase-2-headless-core-prototype-plan.md)
- [Phase 2: Verification Checklist](phase-2-verification-checklist.md)
- [Phase 3: Browser Stability First Brief](phase-3-browser-stability-first-brief.md)

## See Also

- [`docs/api-reference.md`](../api-reference.md) — HTTP API reference
- [`docs/architecture.md`](../architecture.md) — system architecture
- [`docs/phase-2-completion.md`](../phase-2-completion.md) — Phase 2 completion summary
