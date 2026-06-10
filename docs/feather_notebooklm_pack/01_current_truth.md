# Feather Current Truth and Working State

Feather is a local Chromium browser runtime that lets AI agents operate real browser sessions through a controlled HTTP API. This source explains the current project state, active identities, shipped proof points, and near-term choices as of 2026-06-10.

## Status Snapshot
Phase 4a / Feather v1 is in late stage.

## Built and Verified
- v1 Instagram test completed.
- showcase suite completed.
- observe / act-by-ref loop shipped.
- daily-driver background launch shipped.
- primary re-warmed with Roi's real Google identity.

## Active Identities
- **primary**: Roi's real warmed Google identity.
- **scratch**: the test identity.

## Current Worktree: Graphify Side Experiment
Graphify side experiment awaits a keep/discard decision.

## Immediate Next Choices
The immediate next major choices are the observe-loop measurement or v2 Gate A. Next major safety work planned is v2 Gate A.

## Known Caveats
- `continuity.test.ts` is a known pre-existing failure issue.
- pi_agency is parked after an honest PARTIAL.

## What NotebookLM Should Not Infer
- Do not infer that agents can freely use primary. primary is Roi's real personal identity and must not be treated as a sacrificial test profile.
