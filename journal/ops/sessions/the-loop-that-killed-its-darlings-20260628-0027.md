# Session — The Loop That Killed Its Darlings (2026-06-28 00:27 IDT)

Session 2 of the bench reframe. Ran a self-paced research-and-design **/loop** that fired one
adversarially-verified Workflow per strand (multi-modal sweep → 3-vote refutation → synthesis), then a
final synthesis (draft → completeness-critic → reconciled). **~140 agents, ~5M subagent tokens.** Designed
the whole **Tower** bench on paper. **No product code.** Folds in the Session-1 + brainstorm `/next` bridges.

## Commits (on `dev`, NOT pushed)
- `9ff93de` — Stage-1 monorepo orientation (`gym/`→`tower/`, seams, hygiene; committed early this session).
- `4e69b2e` — the research loop output (6 digests + verbatim receipts + decisions log).

## The locked outcome — D2 identity
The **Tower** = an open, self-hostable, **tool-agnostic** TS/Node bench that drives ANY agentic web tool
(Feather, browser-use, Stagehand, nodriver, raw Playwright) and scores it on **ALL angles** — **capability**
(a *gate*, not the headline), **detectability** (signature = the **warmed-vs-cold authenticated-session
delta**), **security/exploitability** — folded into a per-tool **cap/det/sec profile**, converging toward a
**"boss tower."** A broad framework, NOT a niche. Multi-tower system = design intention (kept extensible),
not built now.

## Decisions D1–D6 (full text + receipts → `tower/research/raw/README.md`)
- **D1 niche (SUPERSEDED) → D2 broad all-angles framework** — Roi corrected "too niche" mid-loop.
- **D3 scoring** — capability = GATE (reuse WebArena+WebJudge); tool-agnostic for capability but
  **DRIVER-TRANSPARENT for detectability**; warmed-vs-cold delta = signature; ASR any-of-3. The honesty
  pass **killed 4 of 8** scoring decisions (universal thresholds, fixed weights, degenerate BID control).
- **D4 design** — 3 designs → judge panel → **WINNER = Design B** (thin TS/Node core, **extend `tower/`,
  NOT re-platform**) + grafts (two-boundary, no-attach rule, passive JA3 tap). A (Python BrowserGym) and
  C (Docker-per-tool) both scored buildability **3/10**.
- **D5 data/knowledge** — **JSONL-in-git = truth; SQLite = rebuildable read-index**; corpus audit (measured:
  185 docs, fits in memory) → **stay on grep**, no RAG; **RESOLVED the radar conflict** (drop the polygon →
  small-multiples / parallel-coords with CI bands).
- **D6 security** — 12 attack classes (borrowed, not invented); **purpose-owned victim app**; objective
  ASR + a mandatory injection-marker probe (defeats "security-by-incompetence"); own-arena ethics +
  responsible disclosure → `tower/SECURITY-TESTING-POLICY.md`.

## Loop output (committed `4e69b2e`)
- 6 digests: `tower/research/2026-06-27-0{0..5}-*.md` (00 = the synthesis capstone, DoD-complete + critic-verified).
- Verbatim receipts: `tower/research/raw/strand{1..5}-*.json` + `synthesis-critique.json`.
- Decisions log + strand index: `tower/research/raw/README.md`.

## Documentation pattern established (Roi's correction)
Roi: don't keep only final results — keep **sources + findings + decisions, copied verbatim** into a docs
dir, never rewritten. → each strand = a readable **digest** + **verbatim JSON receipts** (jq-extracted from
the workflow's returned objects; the *edit-the-`return`-then-resume-cached* trick recovers them at zero
token cost). Memory: `research-documentation-preference`.

## Unfinished / next
- **THE BUILD PHASE — PR-1 MVP** (per the synthesis): extend `tower/`; 2 adapters (Feather HTTP +
  browser-use subprocess); 1 detectability level (rebrowser `runtime_enable`, self-post by nonce,
  **no-attach**); 1 security level (WASP-style comment injection, ASR k=3); aggregator v0 with
  Clopper-Pearson CIs + the profile render (**small-multiples, NOT radar**). *Honest failure = success.*
- **Cheap doc-hygiene Strand 4 flagged** (recommend doing this first, <1hr): promote the decisions log →
  standalone `tower/decisions.md` (with the **D6 WASP→RedTeamCUA wording fix** the synthesis noted);
  `docs/GLOSSARY.md` (gym/gymnasium/tower/bench; stealth/detectability; warmed/cookie-mine); finish the
  `gym→tower` rename across `docs/specs`/`docs/plans`/`blog`/`AGENTS.md`; index `tower/` in `journal/docs-map.md`.
- **UNPUSHED:** `9ff93de` + `4e69b2e` on `dev`.

## Next concrete action
Doc-hygiene batch (makes the corpus searchable for the build), **then** start the build phase (PR-1 MVP). Roi's call on order.

## Roi quotes (verbatim)
- "i dont want it to be 'too nich' i want it as a framework to test ai agents on web interface on all angels with the tower idea"
- "i even imagain several towers the user can test theire agents againts and one like a boss tower where every angel gets checked. but the multy tower thing is out of scope just take the intention"
- "i dont want only the finel results but i want the sources, the helpful and relevant findings and the decisions."
- "best if we can copy those to a dedicated documentation dir instead of rewriting"
- "you think we sould first synthesis before we stop?" → "okay" → "go for it"
