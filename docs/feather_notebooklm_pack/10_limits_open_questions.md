# Feather Limits, Risks, and Open Questions

Feather is a local Chromium browser runtime that lets AI agents operate real browser sessions through a controlled HTTP API. This source explains what Feather does not do yet, known risks, parked work, and unresolved questions.

## Product Limits
- Feather is not a polished consumer browser.
- Feather is not a production cloud service.
- Feather is not a Chrome extension strategy.
- Feather is not yet a complete MCP product surface.

## Safety Limits
- Feather is not yet safe for unrestricted real-account agent operation.
- Real personal accounts should not be freely operated by agents before safety gates.

## Technical Risks
- Launch/session lifecycle risk: persistent profile locks can remain if process crashes before normal close handling.
- v2 stealth gaps: act-human typing cadence + bot self-check remain deferred.

## Known Test Issues
- `continuity.test.ts` fails consistently (pre-existing issue).

## Parked Work
- pi_agency integration is parked.
- Graphify side experiment not yet merged/kept.

## External Blockers
- Screen-recorder install for hero-demo recording.

## Questions for Future Planning
- How to structure the visual Zen-style browser shell (Phase 4b).
