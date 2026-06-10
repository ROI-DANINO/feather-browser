# Feather v1 Showcase — Agent-Driven Run (test_1)

**Date:** 2026-06-10 (run window ~16:55–17:12 local / 13:55–14:12 UTC)
**Mode:** **Agent-driven, prompt-only** — NOT the scripted `examples/showcase.sh` recipes.
**Server:** `npm run dev` (headed-capable; started under `WAYLAND_DISPLAY=wayland-1`), baseUrl `http://127.0.0.1:37589`.

## What this run was

Each of the 10 showcase errands was handed to a **separate Feather operator agent** (a fresh
`general-purpose` subagent) as a **plain-English errand and nothing else** — no CSS selectors, no
recipe, no parse hints, no answer key. Each agent had to accomplish its errand by driving a real
headed Chromium through the Feather HTTP API using the operator skills
(`using-feather-browser` + the workflow skills), running the observe → act-by-ref → re-observe loop
itself. Agents were explicitly told **not** to read `showcase.sh` or the spec (that would be cheating),
and to optimize for **truth, not green checkmarks** — a clean PARTIAL/FAIL with a recorded lesson is
a successful test.

This contrasts with the **scripted** suite (`showcase.sh`), where the recipes already "know" the
selectors and parse logic. The point of test_1 is to measure **true agentic capability**, and to see
where agent-driven beats or trails the rigged script.

### Wave structure

- **Parallel wave (7 agents, concurrent, own disposable headed sessions, no login):**
  E1, E2, E3, M1, M2, M3, H4.
- **Serial wave (3 agents, one at a time on the warmed `scratch` profile, login-gated):**
  H1 → H2 → H3. Serialized because the warmed profile enforces 1-session-per-profile in code.

The warmed wave was held until the parallel wave drained, to avoid load-induced CDP-spawn timeouts
(the headed CDP attach has a 10s budget) corrupting the centerpiece tasks.

## Results

| Task | Errand | Verdict | Result (one-line) |
|------|--------|---------|-------------------|
| E1 | HN top story: title + points | **PASS** | "I Hate (Most) Keyboard 'Fn' Keys" (danq.me), 61 pts |
| E2 | Tel Aviv weather | **PASS** | 27°C, Sunny (Google weather widget) |
| E3 | microsoft/playwright stars | **PASS** | 90,664 (exact, via `title` attr; "90.7k" shown) |
| M1 | web search "Feather Browser" | **PASS** ⭐ | top = "SimplyCEO / Feather Browser" (GitLab); **no bot wall** |
| M2 | httpbin form fill+submit | **PARTIAL** | httpbin 503 to real Chromium (curl got 200) — CDN bot-block |
| M3 | Mount Everest elevation | **PASS** | 8,848.86 m (29,031.7 ft); disambiguated from prominence |
| H4 | multi-tab: 3 facts | **PASS** | HN title \| +29°C \| 90,664 stars (3/3, one session, 3 tabs) |
| H1 | next Israeli holiday → all-day Calendar event | **PASS** | Rosh Hashana, Sep 12 2026; event created + verified |
| H2 | Google → top article → extract | **PASS** | Wikipedia *History of the Internet*; grounded summary |
| H3 | IG: pick real post, like + comment, verify | **INCOMPLETE** | socket death ~7.5 min in; like likely landed, no verdict |

**Tally: 8 PASS, 1 PARTIAL, 1 INCOMPLETE.**

> Scripted-run comparison (previous session, 2026-06-10 ~14:00): 8 PASS / 2 PARTIAL, with M1 and H3
> the PARTIALs. **Agent-driven flipped M1 to PASS** (see below). H3 here is INCOMPLETE (infra death),
> not a clean PARTIAL — different failure class.

## Headline findings

1. **M1: agent-driven beat the script.** The scripted suite PARTIAL'd M1 on every run — a cold,
   headless disposable profile hits Google's consent/bot wall. The M1 agent, driving a **headed**
   profile straight to `google.com/search?q=…`, hit **no wall** and pulled real organic results.
   Going directly to the search URL (not the homepage consent flow) avoided the trap.
2. **Cookie-Mine demonstrated live (H1).** The H1 agent's `WebFetch` of timeanddate.com returned
   **HTTP 403 (bot wall)**, but the **warmed Feather browser loaded the same page fine** — a real,
   unplanned demonstration of the warmed-human-session premise.
3. **Honest PARTIAL on M2.** httpbin.org returned **503 to the real Chromium** on 4 attempts while
   `curl` (even UA-spoofed) got 200 — a TLS/header-fingerprint CDN block, not a Feather fault. The
   agent reported the empty 503 page instead of hallucinating a form.
4. **Agents self-improved on data fidelity.** E3 and H4 both reached past GitHub's rounded "90.7k"
   header to the exact `title` attribute (90,664) without being told to. M3 specifically
   disambiguated the *Elevation* infobox field from prominence/isolation.

## Cross-cutting product issues surfaced (real follow-ups)

- **[teardown] `DELETE {force:false}` trips `ENOTEMPTY` on disposable-profile cleanup** — hit by
  **two** independent agents (E2, H4). Both recovered with `{force:true}`. Reproducible rough edge in
  session teardown; the non-force delete races on removing the profile dir's `Default/` subtree.
- **[tabs] No tab-discovery route for links that open in a new tab (H2).** A SERP anchor that opens
  in a new tab returns `clicked:true` without navigating the active page, and there is **no
  `GET /tabs`** to discover the spawned tab. H2 worked around it by navigating the active page to the
  discovered URL. Candidate fix: surface a `navigated`/new-`pageId` signal, or add tab enumeration.
- **[extract] `/extract` body shape is a stumbling block.** E3 and H4 both failed validation until
  they supplied the `{recipe:{fields:{… type:"text"|"attribute"}}}` shape with per-field `type`.
- **[stability] H3 socket death.** ~7.5 min into the warmed Instagram session, the agent's connection
  to Feather flooded with socket-closed errors (19×) and the agent died. Cause not yet root-caused
  (load? headed-CDP instability on a long IG session? CDP websocket drop?). See `tasks/H3.md`.
- **[calendar] Quick-create has no all-day toggle (H1).** Must click "More options" to reach the full
  editor; the "All day" checkbox there is unlabeled in the action list (text-target it).
- **[verify] Calendar MCP reads a different Google account than the warmed browser (H1).** MCP
  `list_events` queried `roi126584` primary; the warmed profile is `roionly9` ("Roi Only") — so the
  MCP is NOT a valid cross-check for browser-driven Calendar work on this profile.

## Layout

```
test_1/
  README.md                       ← this file (overview, results, findings)
  tasks/<TASK>.md                 ← per-task: errand given, verbatim agent report, session id, pointers
  raw/<TASK>.agent-transcript.jsonl   ← FULL verbose subagent transcript (every tool call)
  feather-logs/<TASK>.<sessionId>.jsonl  ← Feather server-side session log (lifecycle + navigations)
  feather-logs/_server-stdout.log     ← server boot stdout
```

### Test → session map

| Task | sessionId | agent transcript |
|------|-----------|------------------|
| E1 | ses_c11bd49aa7 | raw/E1.agent-transcript.jsonl |
| E2 | ses_cd6f6c88f2 | raw/E2.agent-transcript.jsonl |
| E3 | ses_e2ad12d18c | raw/E3.agent-transcript.jsonl |
| M1 | ses_1af299e5dd | raw/M1.agent-transcript.jsonl |
| M2 | ses_515aaf4af9 | raw/M2.agent-transcript.jsonl |
| M3 | ses_d0ef9cfd93 | raw/M3.agent-transcript.jsonl |
| H4 | ses_28982d2966 | raw/H4.agent-transcript.jsonl |
| H1 | ses_a8a6c03d76 | raw/H1.agent-transcript.jsonl |
| H2 | ses_ec2e7f6120 | raw/H2.agent-transcript.jsonl |
| H3 | ses_27bd6fbd04 | raw/H3.agent-transcript.jsonl |

> Mapping method: each Feather session log records `navigate` URLs; sessions were fingerprinted by
> where they went. E2 and M1 both used Google search — disambiguated because E2's agent self-reported
> its `sessionId` (ses_cd6f6c88f2).

## Notes for analysis / resume

- **H3 is the open item.** It likely liked a real post on `feather_test_roi` (an `Unlike` state
  appears in its transcript) and may have typed a comment, but never verified or reported. Check the
  account's recent activity before deciding to re-run.
- One **duplicate-risk artifact**: H1 created a real all-day "Rosh Hashana (Israeli Public Holiday)"
  event on Sep 12 2026 on the `roionly9` calendar. A prior (scripted) run also created one. Clean up
  duplicates if desired.
- The Feather server was left **running** after the run for fast resume.
