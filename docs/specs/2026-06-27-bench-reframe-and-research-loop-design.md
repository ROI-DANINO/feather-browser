# Feather Reframe + Next-Session Research-and-Design Loop — Design

> **Status:** brainstorm outcome, 2026-06-27. Captured thinking that defines the **goal and shape of
> the next session's research loop**. This spec does NOT design the tower's levels — it defines the
> loop that will research and propose how the tower should work. The loop's output feeds the
> level-design session after it.
> **Supersedes/sharpens:** `docs/specs/2026-06-24-gymnasium-and-harness-vision.md` (the gym idea).
> **Inputs already gathered:** `journal/raw/_inbox/2026-06-27-bot-detection-signals-research.md`
> (cursor-render settled), `research/2026-06-23-bot-detection-landscape-research.md`,
> `docs/testing/5d2-baseline/baseline-report.md`.

## 0. Precursor — monorepo orientation pass (gates the loop)
Before the loop runs, next session does a **light orientation pass** (its own brainstorm→plan→execute→
verify, careful — it's a public repo): keep ONE clean **monorepo** (NOT a repo split — decided
2026-06-27, for the portfolio story), fix the objectively-wrong (stray tracked root `inbox/`,
force-committed `demo-hero-mfa.mp4`, loose root test videos), fence the tower's *coming* artifacts in
`.gitignore`, and set legible top-level **seams**: product (`src`/`tests`/`examples`/`skills`) vs
build-in-the-open **spine** (`journal`/`docs`/`research`/`blog` — demoted so product greets visitors
first, but NOT cut out — the start/next/stop pointers assume co-location) vs **tower** (promote `gym/`
→ a real `tower/` home; it already drives Feather over HTTP and never imports `src/`). **Decide the
split-trigger** ("tower leaves for its own repo when X") but do NOT extract — the loop (strands 3 & 4)
defines the tower's real shape/deps; extracting now = guessing. The loop runs once the structure is
clean, so its outputs land in `tower/`.

**Two-stage reorg straddling the loop** (ordering, settled 2026-06-27): the cleanup splits in two.
**Stage 1 — the shell (BEFORE the loop):** the hygiene + seams + `tower/` home + gitignore above —
cheap, loop-independent, gives the loop a clean drop zone. **Stage 2 — the guts (AFTER the loop):**
what lives *inside* `tower/`, the data-store choice, the eventual repo-split — these depend on the
loop's findings, so settle them in the build phase with knowledge, not guessed early. Rule: cheap
loop-independent cleanup first; shape-dependent structure after the loop.

## 1. The reframe — what Feather became
Feather started as an **agentic browser that runs errands**. It is becoming an **open bench that
measures how _detectable_ AND how _exploitable_ agentic browser tools are** — a comparative
red-team/eval harness for the whole class of agentic browser automation (Feather, browser-use,
Stagehand, Patchright, nodriver, …), not just Feather's own driver.

**Why this identity (the convergence):** you can't win the bot-detection evasion arms race solo — so
stop trying to *win* it and *measure* it instead. The weakness becomes the product. It targets a
genuinely under-served niche: **authenticated/warmed-session agent eval**, and the emerging,
barely-benched frontier of **agentic-browser security** (indirect prompt injection, agent exfiltration,
injection-through-the-agent).

**Two level families** (designed later; named now so the loop researches both):
- **Detectability** — *can the tool pass as human?* Graded by **detectors you don't control**
  (incolumitas, FCaptcha, Brotector, CreepJS…). Outsource the *grader*.
- **Security / robustness** — *can the agent be exploited?* Indirect prompt injection from page
  content, tricked exfiltration/actions, SQLi/XSS *through* the agent. Grader is **objective attack
  success** ("did it land?"); you outsource the *attack taxonomy* (AgentDojo, InjecAgent, OWASP-style),
  not the grader.

## 2. The "player": outward bench
The tower drives & scores **any** agentic browser tool through a common adapter. Identity is settled as
**outward**. Honest build note (not a scope change): we prove the bench on **2 tools** before fanning
out — *research wide, build staged*.

## 3. How the next session runs (the mechanism)
A **hybrid**: a self-paced **`/loop`** holds the goal + guardrails + definition-of-done; each pass
**fires a dynamic Workflow** (subagent fan-out, like the 2026-06-27 deep-research run) to do one chunk,
then judges progress and **authors the next pass's focus from what it just learned**. The loop
**self-terminates** when the DoD is met. One spec (this one) fixes the destination; the loop
self-directs the path inside it. (Workflows are deterministic scripts and don't self-rewrite mid-run;
the loop that fires them does the adapting.)

**Token posture:** Roi supports a long-running loop if the outcome is solid. Research wide; spend on
verification (adversarial 3-vote) over breadth-for-its-own-sake.

## 4. Deliverable strands (sequential; each informs the next)
The loop produces five artifacts, in order. Earlier strands shape later ones.

1. **Landscape + gap.** Existing **agentic-browser benchmarks** (WebArena, WebVoyager, BrowserGym,
   Online-Mind2Web, GAIA…), **bot-detection benches**, and **agent-security benches** (AgentDojo,
   InjecAgent…). Output: what's occupied vs. where Feather's bench is differentiated. *Decides the niche
   before designing.*
2. **Scoring methodology + test catalog.** Outsourced from real detectors/benchmarks into a
   tool-agnostic measurement spec — axes, detectors, attack corpora, pass rules — for **both** level
   families. *Don't invent a rubric; let graders-you-don't-control + objective attack-success decide.*
3. **Tower design proposals.** 2–3 full, cited, ranked designs: what it tests, scoring, and the
   **multi-tool adapter architecture** (how one harness drives N different agentic tools).
4. **Data & knowledge architecture.** Survey **all** data-organization methods (relational, columnar/
   analytics e.g. DuckDB, document, **graph**, time-series, structured files, vector) + analytics + 
   **visualization** tools (a `tool × detector × score over time` scoreboard is the portfolio money-shot).
   Recommend the *right shape per data type*, sized & durable (polyglot persistence; git for text/
   artifacts; backups for results; artifacts on filesystem referenced by path — never blobs in the DB).
   **Includes a corpus AUDIT** (see §6): where do we actually stand on terminology-drift and
   unstructured-volume *today*.
5. **Security / injection axis.** Attack taxonomy + objective grader + the **deliberately-vulnerable
   target infra** the security levels need (an OWASP-Juice-Shop-style victim app, for agents) +
   the **dual-use ethics / responsible-disclosure framing** (mirror `docs/testing/anti-bot-testing-
   policy.md`: my own arena, my own target, no working exploits against named third-party tools without
   care).

**External research gaps feeding strands 1–3** (the angles already scoped, not yet run): CDP-detection
internals (Brotector `nameLookupCount` vs rebrowser `runtimeEnableLeak` contradiction; crbug#1477537
`Input.dispatchMouseEvent` leak); **human mouse/keystroke kinematics** (Fitts' law, 2/3 power law,
sub-movements/overshoot, 3–25 Hz micro-tremor — upgrades `mouse-path.ts`); **peer tools** (how
browser-use/Stagehand/Patchright/nodriver generate input & what tells each carries); GPU/WebGL/canvas/
font/TLS-JA3 fingerprinting + worker/iframe cross-realm consistency; self-hostable **detector inventory**.

## 5. Guardrails (the honest-test rules)
- **Graders you don't control.** Detectability graded by external detectors; security graded by
  objective attack-success. Tests that *can* fail.
- **Research wide, build staged.** The loop may research everything; level-building stages later. Don't
  let research scope silently become build scope.
- **Dual-use ethics.** Security research posture; responsible disclosure; own arena/own target.
- **Don't reinvent.** Use existing benchmarks/corpora where they exist; differentiate, don't duplicate.
- **Don't re-research what we have.** Analyze the existing findings (§ Inputs); only research gaps.

## 6. The grep → "something better" trigger + audit
Stay on **grep + a structured index** while the corpus is curated and findable. Move to a richer store
when ANY of these fire (the loop's strand-4 audit reports our *current* standing on each):
- **Terminology drift** — the same concept appears under different words across docs (keyword search
  misses it). *Audit: scan the corpus for concept-synonym scatter.*
- **Unstructured volume** — querying raw transcripts/run-logs (dozens→hundreds), not hand-written docs.
  *Audit: count + categorize current unstructured artifacts.*
- **Context overflow** — relevant docs no longer fit in one read.
- **The 3-grep rule** — routinely running 3+ grep variants to find one thing.
- Rough number: **< ~50 curated docs → grep; past that, or once querying raw transcripts → richer store.**

## 7. Definition of done (when the loop stops)
The loop self-terminates when all five strands have produced their artifact, each **cited**, and a final
synthesis ties them into: **(a)** the locked reframed identity, **(b)** a ranked, *buildable* tower
design (both level families + multi-tool adapter), **(c)** a sized data/knowledge architecture with the
corpus-audit reading, and **(d)** a clear "build strand 1 first" recommendation. No code; no tower
*levels* designed yet (that's the session after).

## 8. Where the session after this one heads
With the loop's synthesis in hand → a **tower level-design** session: pick the design, define the first
levels, build the multi-tool adapter for 2 tools, stand up the minimal data store, prove one detectability
level + one security level end-to-end against a grader we don't control.
