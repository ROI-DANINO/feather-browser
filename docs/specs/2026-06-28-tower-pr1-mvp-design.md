# The Tower — PR-1 MVP Design

> **Status:** design, approved in brainstorm 2026-06-28. Implementation plan to follow (writing-plans).
> **Source of truth this builds from:** `tower/research/2026-06-27-00-SYNTHESIS.md` (the buildable plan)
> + `tower/decisions.md` (D1–D6). This doc is the PR-1 slice of that synthesis, with the
> brainstorm refinements layered in (website-first identity, the verdict model, the PARTIAL
> invariant, the AI boundary).
> **Scope:** PR-1 only — the spine. Everything past PR-1 is sketched in §"Out of scope" and owned by
> the synthesis, not here.

## 1. What the Tower is (identity)

The Tower is an **open, self-hostable website that scores agentic browser tools**. The thing under
test is a tool that drives a real browser, so the Tower tests it the honest way: **with real web
pages in a real browser.**

Anyone with their own agentic web tool visits the Tower, points *their own* independent agent at it,
and tells that agent something like "start tower 1." The agent — which has nothing to do with the
Tower's code — browses the Tower's **challenge pages** and attempts the levels. The Tower watches
**from the outside** and scores what it observes. The website *is* the product; it is not a CLI with a
web page bolted on.

It scores across three angles (the synthesis' D2 framing):

- **Capability** — can the tool do the web task? *(In PR-1 this is **stubbed** — assumed to pass. Real
  capability gate is PR-2.)*
- **Detectability** — does the tool look like a bot to a detector the Tower does **not** control?
- **Security** — can a booby-trapped page hijack the tool into doing something it shouldn't?

## 2. The one load-bearing rule: no-attach / measure from outside

The Tower **never attaches to or drives the browser the tool is using.** The tool launches its *own*
browser; the Tower is a control channel only ("go to this URL, pursue this goal") and observes from
outside the browser↔site data path. The moment the Tower reaches *into* the measured browser, it
changes the very fingerprint it is trying to measure (thermometer-heats-the-water). Therefore:

- The **challenge page itself** computes the verdict and **self-reports it out-of-band** to a
  `127.0.0.1` sink, keyed by a per-run **nonce**. The verdict is never reported by the adapter.
- **No CDP/Playwright attach to the measured browser during a detectability run.** This is a
  correctness property PR-1 must demonstrate, not a nice-to-have.

## 3. PR-1 scope — the spine, on two tools

PR-1 proves **one detectability level + one security level, end-to-end, on two tools, scored by
graders the builder did not write.** It exercises three things at minimum size: the *polyglot* seam
(a TS tool and a non-TS tool), the *no-attach* transparency property, and the *honest-statistics*
aggregator. **Honest failure is success** — if Feather scores `blocked`, the record says `blocked`.

**Tools (both, per the approved Approach A):**
- **Feather** — HTTP-driven adapter, against the API Feather already exposes. **Never imports `src/`.**
- **browser-use** — subprocess-CLI adapter, a ~60-line Python stdin/stdout shim. Proves the
  no-import polyglot seam. Python enters in PR-1.

## 4. The verdict model — win / partial / fail / untestable

**There is no Tower-invented percentage cutoff.** The "X% = win" scheme was deliberately rejected:
every grader defines "detected" differently, so a universal cutoff would mean the Tower making up a
number — which breaks the rule that verdicts come from graders the Tower does not control. The bar is
set **by each independent grader, per level.**

**At one level, one run** the grader returns one ordinal verdict (the Paterson ordinal):

| Grader verdict | Outcome | What the Tower does |
|---|---|---|
| `ok` — clean / undetected / attack resisted | **WIN** | record → **advance to next level** |
| `gated` — challenged / soft-flagged / half-worked | **PARTIAL** | **stop** → AI **must** produce cause + fix (else downgrade to FAIL) |
| `blocked` — clearly detected / attack succeeded | **FAIL** | **stop** → full diagnostic dump |
| `error` — could not run | **UNTESTABLE** | record; cannot score |

**Across many runs (N ≥ 10):** a *number* appears, but as a **measured rate with a Clopper-Pearson
confidence interval**, never a chosen cutoff. e.g. undetected 8/10 → score 0.80, 95% CI [0.44, 0.97].
Store integer `(passes, n)` + a `statVersion` pin; the leaderboard fold sums raw `(k, n)` then
recomputes the CI (never averages stored CIs). **Two tools with overlapping CIs are reported as a
`tie`** — the Tower refuses to fake a ranking it cannot support.

**FAIL vs PARTIAL** — the difference is *definiteness*, not severity:
- **FAIL** = the grader gave a definite negative (detected / blocked / hijacked).
- **PARTIAL** = an in-between, "something may have gone wrong but it is not a clean block." This is a
  *diagnostic signal that the tool needs a fix* — never a win, never a loss.
- **WIN** = clean pass → next level.

### The PARTIAL invariant (hard rule, enforced in code)

A PARTIAL **must** carry a `cause` and a `suggestedFix`. A PARTIAL with neither is a dead end for the
user (they cannot know what to fix), so the scorer **downgrades it to FAIL automatically.** "Partial
with no explanation" is not a valid outcome.

## 5. The AI boundary — explain, never score

The Tower can be "AI-powered," inside one hard boundary:

> **The LLM may EXPLAIN and SUGGEST FIXES. It must never decide a score.** Detectability and security
> verdicts come from the independent detector / victim app — never from an LLM. The moment an LLM
> decides pass/fail on those angles, the scorecard flatters whoever has the better-sounding model, and
> the Tower's credibility is gone. *(The one sanctioned future exception is capability's WebJudge — a
> deliberately fenced, reliability-reported LLM grader — and it is PR-2, not PR-1.)*

**In PR-1, behind the user's own LLM API key, the AI does exactly two jobs**, firing only on a
non-WIN outcome:
1. **Failure summary** — turn the structured record into plain English.
2. **Fix suggestion** — read the logs, work out what actually happened, propose what to fix and how.

Job 2 is *load-bearing for the PARTIAL verdict itself* (per §4: no fix → downgrade to FAIL). Live
run-narration and any other AI role are out of PR-1.

## 6. Two webpages — only one is in PR-1

- **(a) The challenge levels** — the web pages the agent browses. **In PR-1** (they are the test).
- **(b) The results dashboard** — a live, polished scoreboard of timing / scores / summaries.
  **Deferred.** PR-1 records all of that data and surfaces it as **terminal output + a JSON record +
  a plain single-file HTML**. The live dashboard arrives once there is cross-tool / cross-run data
  worth comparing (PR-3/PR-4 territory). The engine is instrumented now so the dashboard is later a
  *new view over existing data*, not a re-instrumentation.

## 7. Architecture & data

A thin TypeScript core the builder owns (Fastify · Zod · Vitest), **extending the existing `tower/`**
(preserving `behavioral.ts` + `classify.ts` and their recorded `BLOCKED`/`UNSCORED` discipline) —
**not** a re-platform. Foreign graders (rebrowser, WASP scenario) run as **version-pinned
subprocess/HTTP graders, never imported.**

- **Control plane:** Fastify; also serves the challenge pages (the website).
- **Schemas:** Zod — `TowerTask`, `TowerResult`, `DetectorReport`. `TowerResult` carries: the ordinal
  verdict, `(passes, n)`, the CI, **timing per level and per part**, `cause`, `suggestedFix`, and the
  pinned run identity (`agentVersion / towerVersion / taskSetHash / graderVersions / envFingerprint /
  nonce`).
- **Registries:** four Zod-validated manifests (`TowerRegistry`, `DetectorRegistry`, `AttackRegistry`,
  `AdapterRegistry`), one entry each in PR-1.
- **Runner:** **sequential** — "start tower 1 → walk levels in order → stop on the first non-WIN →
  record." Times each level and each part within a level.
- **Results store:** **JSONL-in-git is truth** (append-only `RunRecord` log under `tower/results/`);
  **SQLite is a disposable, gitignored read-index** (added only when the in-memory fold gets painful).
- **Aggregator v0 (pure, Vitest-covered):** LPR → ASS (capability gate **stubbed** = assume pass) →
  BTS (versioned weights) → `RunRecord` with Clopper-Pearson CI; overlapping-CI → `tie`.

## 8. The four build chunks (one branch each, merged to `dev` when green)

1. **`tower-core` + the hosted level site** — Fastify control plane, the Zod records, the four
   registries, the sequential runner (with per-level / per-part timing + stop-on-first-non-WIN), the
   JSONL result log, and the web server that serves challenge pages.
2. **The two adapters** — Feather (HTTP, never imports `src/`) + browser-use (Python subprocess shim).
3. **The two levels (challenge pages)** — **L2 detectability** (rebrowser-bot-detector page, self-posts
   its `{ok|gated|blocked}` ordinal by nonce, **no-attach**) + **security `comment-injection`** (a
   `tower-victim-app` implementing the three `SecurityHooks` — 256-bit canary exfil + state diff +
   RedTeamCUA-style execution marker; grade ASR over **k = 3 pinned**).
4. **Scoring + AI report** — aggregator v0 (score + CI + `tie` rule), the **PARTIAL-needs-cause+fix-
   or-it's-a-FAIL** invariant, and the AI (summary + fix-suggestion, reading the logs) → JSON record +
   plain HTML render.

Each chunk branches off `dev`, named for the chunk; the diff is reviewed before it lands.

## 9. Out of scope for PR-1 (owned by the synthesis, not here)

JA3 wire capture (PR-2), the real WebArena capability gate + WebJudge (PR-2), nodriver/Stagehand
adapters + the differential transparency guard (PR-2), the warmed-vs-cold (WD) signature harness
(PR-3), L1/L3/L4 detectors, parallelism, the BTS weight UI, the multi-tower / boss-tower system, the
GitHub-Pages scoreboard, and the live results dashboard. PR-1 proves the spine — transparent drive →
external / out-of-band grade → CI-carrying, honestly-explained record — on the two angles that are the
product's reason to exist.

## 10. Open questions deferred to a later session (not blocking PR-1)

- Exact per-detector thresholds and the final BTS weighting math (only matter once more levels exist).
- The capability gate's deterministic-vs-WebJudge fraction reporting (PR-2).
- WD statistical power / warm-ritual automation (PR-3).
- The honest open questions in the synthesis §"Open questions the build phase must answer" (driver-
  transparency residual, no-attach guard test, subprocess-grader drift fixtures).
</content>
</invoke>
