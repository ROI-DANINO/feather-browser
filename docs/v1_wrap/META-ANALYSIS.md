# v1-wrap meta-analysis — corrected gap classification (2026-06-11)

**What this is:** the gap meta-analysis Roi asked for after the two v1-wrap runs — Feather
agent-driven (`test_1/`) vs Claude for Chrome (`claude-for-chrome/`). It classifies every non-PASS as
**environmental-rerunnable vs platform/code**, folding in evidence that did not exist when the
comparison docs were written: the 2026-06-11 M2 rerun, the scratch-IG account forensics, and a
transcript-level forensic pass by three parallel analyst agents (H3 socket forensics, friction
mining across all 10 transcripts, C4C toolset analysis).

**How to read it against the older docs:** `COMPARISON.md` and `CAPABILITY-AND-V2-GAPS.md` are kept
unchanged as the honest record of what we believed on 2026-06-10. **Where this doc and those docs
disagree, this doc wins.** A corrections register below lists every overturned claim precisely.

---

## 1. Corrected classification of every non-PASS

| Run | Task | Old verdict & attribution | Corrected classification | Evidence |
|---|---|---|---|---|
| Feather | M2 (httpbin form) | PARTIAL — "Feather platform (fingerprint)" | **ENVIRONMENTAL — not reproducible; cause undetermined** | 2026-06-11 rerun: headed nav 200 + form submitted + echo verified, **and** headless control 200 ×3 — the block is gone, so M2 is rerunnable and resolved. But the *original* run's data cut the other way: the browser (headed-CDP disposable) got 503 on 4 consecutive navs while **concurrent curl got 200 every time, even UA-spoofed**, and C4C's real Chrome was served the same afternoon. Clean client-discrimination is not what random flakiness looks like; a *temporary* CDN bot-mitigation window (fingerprint-sensitive) fits at least as well, and a next-day rerun cannot distinguish the two. Net: environmental-rerunnable either way, but **M2 is unusable as Stealth-Stack (5d) evidence or as its regression test** — in either direction. |
| Feather | H3 (IG like+comment) | INCOMPLETE — "CDP socket death" (platform P0) | **Run death: ENVIRONMENTAL. Task stall: PLATFORM/CODE (viewport bug).** Two separate facts — see §2. | Forensics below. |
| C4C | H3 (IG like+comment) | FAIL — "IG logged out; Feather burned the session" | **ENVIRONMENTAL — account gone, cause unknown** | At re-login (2026-06-11) the old `feather_test_roi` account **did not exist** (not merely logged out). The "Feather automation burned the session" theory is additionally unfounded because Feather H3 never performed a like/comment at all (§2b). |

Everything else was a PASS on both harnesses (8 tasks), with convergent tactics and honest
reporting — the "agents are equally capable reasoners" finding stands.

## 2. The H3 forensics — what actually happened

### 2a. Whose socket died: the harness's, not Feather's

The committed P0 ("long-session CDP/connection durability", "~19 stacked socket-closed errors") is
**built on a misread**. Transcript-level findings (verified independently by two analyst agents):

- The transcript contains exactly **one** socket error, not ~19: the final line, an
  **Anthropic-API harness error** (`"isApiErrorMessage": true`, `"model": "<synthetic>"`, Anthropic
  `requestId`) at 14:18:28 — the subagent's own LLM connection died. The "~19×" was a grep artifact:
  the agent had been grepping `/proc/<pid>/fd` for `socket:` inodes and discussing websockets in its
  own prose.
- **None of H3's Feather HTTP calls failed at the transport level** — every call got an HTTP
  response (one of them a 404 on the nonexistent `/resize` route). Its last tool call (14:17:05)
  was a *successful* curl to Chromium's CDP endpoint listing live tabs — Feather and Chromium were
  demonstrably healthy 83 seconds before the death.
- CDP was alive **after** the agent died: the coordinator's manual close at 14:19:13 completed an
  orderly Playwright context close (`tab.closed` events fired 53 ms after the request, not at the
  supposed disconnect time). `_server-stdout.log` has zero errors.
- The error string appears in **only** H3 of the 10 transcripts — no Feather-wide pattern. Same-day
  precedent for harness-side subagent death exists (spend-limit kills in the 12:03 session).

**⇒ H3's death is ENVIRONMENTAL (harness/network), rerunnable. The P0 evidence is withdrawn.** CDP
durability stays a watch-item (long sessions will matter), but this run provides zero evidence for
it and it should not outrank evidenced work.

### 2b. What H3 was doing for 7.5 minutes: stuck on a real Feather bug

H3 made **zero** `/type`, `/press`, or `/dismiss` calls. The "Like ×1 / Unlike ×1 / Not Now ×1"
signals in `test_1/tasks/H3.md` are grep matches inside the **errand prompt text** the agent was
given, not page state. **No like was ever placed; no comment was ever attempted; there is no
real-world side effect.**

What actually blocked it: H3 created its session with `"viewport":{"width":1280,"height":800}`, but
**`chromium-headed-cdp` mode silently ignores the viewport** — `spawnAndConnect()`
(`src/browser/modes.ts:67-115`) passes no `--window-size`, and `connectOverCDP` attaches to whatever
window Chromium opened, while the headless path (`buildLaunchOptions`, same file) honors viewport.
The window came up narrow; Instagram rendered its "Get the tablet app" interstitial; the agent's two
clicks on it were silent no-ops (`clicked:true`, nothing happened). It then tried
`POST .../resize` (route doesn't exist → 404), wished for an evaluate endpoint, grepped Feather's
own source, correctly diagnosed the viewport bug from `modes.ts`, hunted the dynamic CDP port via
`/proc`, and was composing a raw `Browser.setWindowBounds` CDP call when the harness connection
died. ~6 minutes, ~17 tool calls of workaround on the run's centerpiece task. (Endpoint inventory,
review-verified: navigate ×1, observe ×1, snapshot ×3, click ×2, screenshot ×1 plus one read of the
saved PNG, resize ×1 → 404.)

**⇒ The stall is PLATFORM/CODE and it is v1-core (a request parameter accepted and silently
dropped), not v2 security work.** One honest caveat: the counterfactual "honoring 1280×800 would
have rendered the desktop feed" was never tested — the actual window was ~990 px wide, and the
agent itself mid-run wondered whether 1280 would still trip the interstitial. The bug is real and
it demonstrably blocked the agent's recovery path; whether the fix alone would have saved H3 needs
the acceptance check noted at ★1.

### 2c. The Instagram account

The old `feather_test_roi` account **no longer existed** at re-login on 2026-06-11 (not "logged
out" — gone; cause unknown, possibly disabled by IG as a young automation-adjacent account). With
2b established (no automation actions ever fired), the "Feather's H3 automation tripped IG's
defenses and burned the warmed session" narrative has **no supporting evidence left** *as stated*
(no like/comment existed to trip a checkpoint). To own the full possibility space: Feather's
headed-CDP visit itself, and C4C's later extension-driven visit, both remain possible contributors
to IG's decision about a brand-new account — we cannot rule that in or out. File under
*cause unknown / account gone*. A fresh scratch IG (`roionly9`) was created 2026-06-11, and H3 was
**redesigned to a read-only errand** (screenshot a popular influencer's post + summarize comments)
and completed agent-side the same day.

## 3. Corrections register (committed docs left as-is; this section is the diff)

| Doc & location | Claim | Status |
|---|---|---|
| `CAPABILITY-AND-V2-GAPS.md` P0 (≈L55-58) | "H3 died on ~19 stacked socket-closed errors… heartbeat/keepalive on the CDP websocket… *first thing to fix*" | **Withdrawn.** One harness-side Anthropic-API error; Feather/CDP healthy. P0 demoted to watch-item. |
| `CAPABILITY-AND-V2-GAPS.md` P1 / `COMPARISON.md` finding 1 | "M2 = clean controlled experiment… automation fingerprint… concrete regression test for 5d" | **Withdrawn as M2-evidence — in both directions.** Rerun: 200 on both headed and headless, so the block is gone and "controlled experiment" no longer holds; but the original curl-200-vs-browser-503×4 discrimination means "it was never fingerprint" can't be claimed either. Cause undetermined; M2 is unusable as 5d evidence *or* counter-evidence, and not its regression test. Stealth (5d) keeps its *other* evidence (M1 cold-headless search walls; scripted-suite history) and its v2 slot. |
| `CAPABILITY-AND-V2-GAPS.md` P2 / `COMPARISON.md` finding 3 / `outputs/H3.md` | "Feather's automation likely liked a post… plausibly tripped IG's checkpoint… burned the warmed session" | **Unfounded.** No like/comment ever fired (prompt-text grep artifact); account later found nonexistent, cause unknown. |
| `test_1/tasks/H3.md` action forensics (≈L44-56) | "dismissed 'Not Now' ×1; Like ×1 and Unlike ×1 appear… very likely LIKED a real post… may have typed a comment" | **Wrong.** Those strings match the errand prompt embedded in the transcript. Actual calls: navigate ×1, observe ×1, snapshot ×3, click ×2 (no-ops), screenshot ×1 (+1 read of the saved PNG), resize ×1 (404). |
| `test_1/README.md` headline "socket death… cause not yet root-caused" | — | **Root-caused:** harness Anthropic-API connection, not Feather. |

## 4. What Feather misses — re-ranked by *measured* cost in this run

The friction mine swept all 10 transcripts: ~111 Feather HTTP calls, 7 hard API failures
(3 VALIDATION_ERROR, 2 ENOTEMPTY, 2 missing-route 404s), 3 silent no-op clicks, 1 task killed.
Ranking below is by measured cost, not vibes. ★ = implement now (v1-core; classified *core browser
stability* or *core API readiness*); ◇ = plan/defer with the reason.

1. ★ **Viewport ignored in `chromium-headed-cdp` + no resize** — killed H3 (426 s, zero errand
   progress). Fix: honor the documented `viewport` param at spawn (`--window-size`), document the
   window≈viewport semantics for headed mode. (A `/resize` route is the follow-on; see plan.)
   Acceptance check owed beyond the unit fix: verify a 1280×800 headed window actually renders an
   IG-class desktop layout (the "fix would have saved H3" counterfactual was never tested).
2. ★ **No way to read input *values*** — `snapshot`/`observe` see text, not `<input value>`. Cost:
   H1 burned 2 screenshot+image-read round-trips just to verify a form before saving; H3 named the
   missing evaluate as one of its two dead ends. Fix: a read-only **`value` read** via the existing
   extract recipe (`type:"value"`) + input values surfaced on observe where cheap. A general
   `/evaluate` endpoint is **deliberately deferred to v2 Gate A** (high-privilege surface;
   ADR-0010 sequencing) — the value-read captures the demonstrated need without it.
3. ★ **New-tab invisibility** — H2's SERP click returned a bare `clicked:true` (ambiguous with
   "nothing happened" — H3's no-op clicks returned the identical shape); `GET /tabs` doesn't exist
   (404); workaround cost ~33 s. Feather *already tracks* popup pages (`context.on("page")` →
   `addPage`) — the gap is purely surface: add **`GET /v1/sessions/:id/tabs`** and a
   **`newPageId`** signal on click when the click spawned a tab.
4. ★ **`/extract` recipe shape friction** — 3 of the run's 7 API failures: the intuitive flat shape
   fails twice over (missing `recipe` wrapper, then missing per-field `type`). Fix: default
   `type:"text"`, infer `"attribute"` when `attribute` is present, and a validation message that
   shows a minimal valid example.
5. ★ **Disposable teardown ENOTEMPTY** — `DELETE {force:false}` failed 2/7 disposable teardowns
   (raw fs error code leaks as the API error). Fix: retry/treat-as-force on the disposable path;
   never surface `ENOTEMPTY` as an API code.
6. ★ **Forensics observability** — the H3 investigation took an agent-hours-scale dig because the
   session log records only lifecycle events (7.5 min of activity left no per-action trace), and
   there's no way to ask "is the browser alive?". Fix: per-action request logging in the session
   JSONL + **`GET /v1/sessions/:id/health`** (CDP-alive ping). Directly serves the
   coordinator-pattern ("agent died vs browser died" in one glance).
7. ◇ **Vision-read as sanctioned perception fallback** — C4C's screenshot+zoom decided/rescued 4
   tasks; Feather's `/screenshot` exists but no agent used it as a *read* input (and one tried to
   curl it as PNG — it returns an artifact descriptor). This is **operator-skill/docs work**, not
   server code: teach the loop "structured read overflows → screenshot → Read the image", and
   document the artifact-descriptor shape. (Server-side zoom/crop param: plan item, low risk,
   not load-bearing for v1.)
8. ◇ **Batch endpoint** (act-sequence + wait + read in one round trip) — real token/latency win
   (ADR-0005 constraint), but it's new API-surface design with failure-semantics questions
   (partial-failure, ref staleness mid-batch). Plan sketch only; decide at 5.0.1 alongside the MCP
   tool-surface reconciliation.
9. ◇ **Response-size tax** — all 10 agents piped responses through `jq/grep/head`; H1 drove
   `observe` with `cap` ×10. The `cap` knob carried it; no change now, watch in v2 MCP surface.
10. ◇ **Stealth Stack (5d)** — keeps its v2 slot and order, with its evidence base now honestly
    M1-class (cold-profile search walls), *not* M2. No new work pulled forward.
11. ◇ **Gate B posture borrowings** (from C4C): declared-origin allowlist per session with
    auditable scope expansion; credentials as a categorically separate hard line (agent never
    types them — CredentialsVault injection). Recorded as input to Session 5.0.2; no code now.

**Also formally noted:** scripted `run_h3` in `examples/showcase.sh` is **RETIRED** per Roi
(2026-06-11) — the H3 errand is agent-driven by design now; the showcase's other recipes remain
but the agent-driven run is the capability benchmark.

## 5. Corrected verdict

With both of Feather's non-PASSes reclassified environmental (M2 resolved on rerun, cause
undetermined; H3's death confirmed harness-side) and C4C's one FAIL environmental (account gone),
**the harnesses are even on agent capability — convergent tactics and honest reporting on all 8
errands both completed**. One asymmetry stays on the books: C4C *did* complete M2 in the same
afternoon window in which Feather's browser was being served 503s — with M2's cause undetermined,
that data point neither proves nor clears a fingerprint sensitivity, so "even" carries that hedge. The honest
asymmetries that remain are: (a) Feather shipped one real, now-located platform bug (headed-CDP
viewport) plus a short list of measured API-surface friction (§4 items 2–6) — all v1-core,
none of it the v2 security spine; (b) C4C's vision/JS/batch vocabulary is a genuine ergonomic edge
worth selectively closing; (c) Feather's observability, honest HTTP status, deterministic refs, and
profile isolation are demonstrated advantages C4C lacks. The v2 security-first spine
(gate → identity → MFA → warmed attach → stealth) is **unchanged** by this analysis — nothing here
jumps the queue ahead of Gate A; the ★ items are v1-core fixes that precede it.

---

*Provenance: produced 2026-06-11 by the Fable dynamic-workflow run (3 parallel analyst agents +
inline source verification). Inputs: `test_1/raw/*.jsonl` (ground truth), `test_1/feather-logs/`,
`claude-for-chrome/outputs/` + `capture/`, the 2026-06-11 M2 rerun and IG re-login session, and
`src/browser/modes.ts` / `src/sessions/manager.ts` / `src/transport/routes.ts` verified at head.*
