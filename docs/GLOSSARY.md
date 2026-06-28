# Glossary — canonical terms & their synonyms

This project was built in the open over months, and a few concepts drifted across names as they
evolved. This file maps each synonym cluster to its **canonical term** so one grep (and one reader)
finds them all. When writing new docs, prefer the canonical term; the older words survive in historical
specs, session logs, and blog entries (which we don't rewrite — they're the build-in-public record).

> Why this exists: the Strand-4 corpus audit (`tower/research/2026-06-27-04-data-knowledge-arch.md`)
> found terminology drift was the one trigger pushing us off plain `grep`. This glossary fixes it at
> zero infra cost — no search index needed. See [[tower/decisions.md]] D5.

## The Tower (the bench)

| Canonical | Synonyms (historical / drifted) | Meaning |
|---|---|---|
| **the Tower** | the gym, the gymnasium, the bench, the bot tower, the bot gymnasium | The outward, self-hostable, tool-agnostic eval harness that drives any AI web-interface agent and scores it across all angles. Top-level dir `tower/`. Earlier called "the gym" (2026-06-24→26) and briefly "the bot tower". |
| **detectability** | stealth, evasion, anti-detection, fingerprint(ing), bot-detection | The angle: *can the agent pass as human against detectors we don't control?* Note: "stealth" historically also meant the (now-cut) goal of *evading* real sites — that's distinct and parked; here it's the *measurement* axis. |
| **warmed (authenticated) session** | cookie mine, logged-in session, persistent session, the warmed profile | A browser profile a human has driven through a real login so it carries real trust state (cookies/session). The agent rides it. The Tower's **signature** detectability level = the warmed-vs-cold delta. |
| **capability** | task-success, can-it-do-the-task | The angle (a *gate*, not the headline): *can the agent complete the web task?* |
| **security / exploitability** | injection axis, can-it-be-hijacked, prompt-injection axis | The angle: *can page content hijack the agent?* (indirect prompt injection, exfiltration, relay). |
| **boss tower** | the boss, the everything-tower | The (design-intention, not-yet-built) tower that checks every angle at once → one cap/det/sec profile. |
| **adapter** | runner, driver-shim, tool-plug | The per-tool shim that lets the Tower drive any agentic tool (HTTP-driven / subprocess-CLI / CDP-attach / library-in-worker). |

## Project structure & process

| Canonical | Synonyms | Meaning |
|---|---|---|
| **Feather** | the browser, the runtime, the body | The Chromium-over-HTTP runtime the Tower drives as one tool among many (never imported by `tower/`). |
| **the spine** | the journal, build-in-the-open, the continuity system | `journal/` + `docs/` + `research/` + `blog/` — the design history + start/next/stop continuity. |
| **digest** | synthesis, write-up, report | The readable markdown output of a research strand (`tower/research/2026-06-27-0N-*.md`). |
| **receipts** | raw outputs, provenance, the evidence | The verbatim subagent outputs behind a digest (`tower/research/raw/*.json`). Copy, don't rewrite. |

_Add a row when a concept picks up a second name. Keep it short — this is a lookup, not a manual._
