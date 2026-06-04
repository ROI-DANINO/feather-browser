# Session Handoff — linux-research-audit-prep
# Date: 2026-06-02 | Branch: dev

## What Happened

Ran `/init` to confirm Phase 3 complete, then a full research pass on two questions:
what did we miss in Phases 1–3, and what should inform Phase 4 planning.

Key pivot mid-session: user clarified Feather Browser is **Linux-only**. This invalidated
the initial Electron recommendation and partially re-validated Tauri.

### Research Output (all in raw/_inbox/)
- `session-2026-06-02-init-research.md` — session context and open questions
- `research-phase4-shell-architecture.md` — Tauri vs Electron vs GTK, Wayland, browser surface
- `research-linux-fedora-tools.md` — system Chromium, D-Bus, libsecret, XDG, GStreamer, Flatpak
- `research-playwright-updates.md` — 1.50→1.55 changes, tracing, screencast API, deprecated .type()
- `research-mcp-playwright-mcp.md` — MCP RC (July 28 final), Playwright MCP vs CLI, Cookie Mine fit
- `research-fastify-v5.md` — v5 breaking changes, migration checklist, fastify-sse-v2 blocker warning

## Key Decisions / Clarifications

| Decision | Detail |
|----------|--------|
| Linux-only confirmed | No cross-platform requirement |
| Electron eliminated | Two Chromium instances (Electron's + Playwright's) = anti-Feather |
| Tauri: candidate but needs prototyping | WebKitGTK stability as daily-driver browser surface is unproven |
| Wayland is a real constraint | No foreign window embedding on Wayland — must plan browser surface carefully |
| System Chromium (RPM Fusion) | Biggest weight reduction opportunity — never explored |
| MCP hub: wait for July 28, 2026 | Spec RC out, final due July 28; major stateless redesign in progress |
| libsecret for Phase 5+ vault | Already solved on Fedora, don't build custom |
| Fastify v4 LTS ended June 2025 | We're running unpatched — migrate to v5 before Phase 4 code starts |

## Three Phase 4 Browser Surface Candidates

A: Tauri/WebKitGTK as browser surface — lightest, but not Chromium, stability risk
B: Tauri shell + Playwright Chromium headed side-by-side — Wayland embedding broken
C: GTK4 native shell + Playwright Chromium — most Linux-native, most complex

Needs prototyping in Phase 4 Step 0 to decide.

## Left Unfinished

- dev → master merge not done
- Phase 4 Step 0 not started
- Fastify v5 migration not started
- TAB_UPDATED event still missing
- ROADMAP/PROGRESS not updated with research findings

## Next Session Focus

**Code audit** — scan the existing codebase for gaps surfaced by the new research and
the Linux-only decision. Find everything worth editing or remaking before Phase 4 starts.

Then, based on audit findings: prioritize and fix.

Optionally: merge dev → master before or after the audit.

## Roi Quotes

- "This product is a Linux only browser."
- "One of the main features is its light weight (feather) and that's why we wanted to use tauri."
- "Do you need to use research again or your founds still makes sense?"
- "Any Linux fedora stuff that matter? Any Linux tools that gives this project any advantage?"
- "I want to record these in inbox. If needed in separate files for order and to not get cheep on context."
- "In the next session I would maybe merge this branch master but more interesting is running an audit to the code."
