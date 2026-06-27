# tower/research/raw — verbatim research receipts

This directory holds the **raw subagent outputs** behind the Tower research loop — the sources, the
findings, and the adversarial verdicts — **copied verbatim**, never rewritten or paraphrased. The
readable synthesized digests live one level up (`tower/research/2026-06-27-0N-*.md`); these JSON files
are the receipts those digests compress.

**Principle (per Roi, 2026-06-27):** don't keep only the final synthesized result. Keep the sources,
the helpful/relevant findings, and the decisions — copied straight from what the subagents produced.
Rewriting loses detail, costs tokens, and reads as trust-me summary. Provenance over paraphrase.

## What's here

| File | What it is |
|---|---|
| `strand1-sweep-findings.json` | The 4 landscape-sweep angles (web-task benchmarks · bot-detection benches · agent-security benches · commercial+warmed-niche). 72 entries, each with name · url · whatItTests · axis · self-host · auth-session · multi-tool · gap-vs-Tower · source-quality. |
| `strand1-verify-verdicts.json` | The 6 load-bearing gap claims, each stress-tested by 3 adversarial lenses (competitor-hunt · methodology · scope-honesty). Each verdict carries full reasoning + source URLs + the survive/refuted tally. |

These are extracted verbatim (`jq '.result.findings'` / `'.result.verified'`) from the workflow's
returned objects — no model in the path. The **full per-agent transcripts** (every web fetch, all
reasoning) are NOT copied here; they remain in the workflow transcript dir
(`…/subagents/workflows/wf_5259d792-4a9/`) as forensic fallback only.

> The permanent shape for this data (flat JSON files vs. a real store) is **Strand 4's** decision
> (data & knowledge architecture). Until then: verbatim JSON receipts + readable markdown digests.

## Strand index

| Strand | Digest (readable) | Receipts (verbatim) |
|---|---|---|
| 1 — Landscape + gap | `../2026-06-27-01-landscape-and-gap.md` | `strand1-sweep-findings.json`, `strand1-verify-verdicts.json` |
| 2 — Scoring methodology | `../2026-06-27-02-scoring-methodology.md` | `strand2-methodology-findings.json`, `strand2-verify-verdicts.json` |
| 3 — Tower design + adapter | `../2026-06-27-03-tower-design.md` | `strand3-design-{A,B,C}.md`, `strand3-judge-verdicts.json` |
| 4 — Data & knowledge arch | `../2026-06-27-04-data-knowledge-arch.md` | `strand4-data-findings.json`, `strand4-verify-verdicts.json` |
| 5 — Security / injection axis | `../2026-06-27-05-security-injection-axis.md` | `strand5-security-findings.json`, `strand5-verify-verdicts.json` |
| 0 — Final synthesis | `../2026-06-27-00-SYNTHESIS.md` | (ties all five) |

## Decisions log

Decisions taken during the loop (the things Roi wants captured, not just findings).

- **D1 — Niche proposed (2026-06-27, SUPERSEDED by D2).** After Strand 1's adversarial pass the agent
  proposed locking a *narrow* niche: a harness scoring N tools on **warmed-session detectability** as
  the headline axis + exploitability second. Rationale was sound on the evidence (warmed-session
  detectability was the only 3/3-confirmed-open cell; the broad "multi-tool comparative" framing was
  refuted — FP-Agent, techinz, MUZZLE, WebTrap Park, WebBench occupy pieces). **But Roi corrected the
  scope — see D2.** Kept here for honest history.

- **D2 — Scope = a broad ALL-ANGLES framework (Roi, 2026-06-27, governs).** "I don't want it too niche."
  The Tower is a **framework to test AI web-interface agents on all angles**, tool-agnostic (bring any
  agent), open + self-hostable. Angles: **capability** (can it do the web task) · **detectability** (can
  it pass as human vs detectors we don't control — the **warmed-session angle is the signature/novel
  level**, NOT the whole identity) · **security/exploitability** (can it be hijacked via the page —
  injection/exfiltration) · others as they prove worth testing. Structure metaphor: **"towers" =
  climbable challenge sets**; design *intention* is several themed towers + a **"boss tower" that checks
  every angle at once**. The multi-tower system is **out of scope to build now** — but the architecture
  must stay extensible toward it. Differentiation = **breadth (all angles in one place) + tool-agnostic
  gym framing + the novel warmed-session level + open/self-hostable**, not a single niche. Strand 1's
  landscape stays valuable as the per-angle "reuse, don't reinvent" map (WebArena-style → capability;
  real detectors → detectability; AgentDojo/WASP-style → security). FP-Agent / techinz / MUZZLE /
  WebTrap Park / WebBench = differentiate against, per angle.

- **D3 — Scoring methodology decisions (Strand 2, 2026-06-27; 4 of 8 survived adversarial stress-test).**
  - **Capability = a GATE, not the headline.** Task-success is saturated → reuse WebArena `program_html`
    graders + Online-Mind2Web WebJudge (LLM judge ~85% human agreement) wholesale. Self-hosted Docker
    sandboxes for reproducible levels; live-site = separate non-reproducible track. PASS-GATE at
    ASS_cap≥0.40, else the whole verdict is UNTESTABLE.
  - **Adapter is NOT one universal boundary** (refuted 3×). Tool-agnostic for capability (BrowserGym-style
    obs/action) BUT **driver/fingerprint-transparent for detectability** — there the driver/CDP/TLS/
    kinematic signals ARE the measurement; hiding them behind a normalizing adapter would measure the
    adapter, not the tool. **This is the load-bearing architecture constraint for Strand 3.**
  - **Detectability levels** L1 automation-presence → L2 CDP-protocol leak → L3 behavioral (FCaptcha) →
    L4 commercial boss-fight. Detector output → **ordinal verdict** (reuse Ian Paterson ok/gated/blocked/
    error), native per-detector thresholds; layer weights = a declared **overridable prior**, not hard
    cardinal (the 0.7-universal-threshold and fixed-70%-weight schemes were refuted 3× / contested).
  - **Signature metric — warmed-vs-cold delta (WD):** human warms a profile (~5min, incl. login) → agent
    TAKES OVER the live session → WD = FDS_warmed − FDS_cold on a matched pair (same agent/detectors/IP/
    driver), restricted to L3+L4, fresh human-warmed profile per run. Isolate the agent-loop signal with a
    **scripted-action replay control** (the no-action control is degenerate); the Behavioral Isolation
    Delta (BID) is a **diagnostic, not a ranking axis** (report N≥3 + CI).
  - **Security = most solid angle.** OBJECTIVE state grader (secret crossed a boundary / state mutated /
    agent obeyed page injection) + **ASR any-of-3 runs** (RedTeamCUA, pin k=3) + utility-under-attack.
    Reuse WASP (end-to-end + intermediate) + AgentDojo. Strand 5 owns victim-app + taxonomy + ethics;
    Strand 3 defines the scoring HOOKS.
  - **Boss tower:** LPR→TS (difficulty-weighted, Clopper-Pearson CI)→ASS (directionality-normalized,
    1=best-for-tool-owner)→PASS-GATE→BTS (0.50 cap / 0.30 det / 0.20 sec, **versioned + user-overridable**)
    →categorical Boss Verdict. **The radar profile is the primary artifact; BTS is secondary.**
    Reproducibility: N_rep≥10 published, **never rank overlapping CIs**, pin agent/tower/task_set_hash/
    grader/env/IP. Full detail + the survived-vs-refuted honesty table: `../2026-06-27-02-scoring-methodology.md`.

- **D4 — Architecture chosen (Strand 3, 2026-06-27; 3 designs → judge panel → ranked B > C > A).**
  **WINNER = Design B: a thin TypeScript/Node core the builder OWNS** (Fastify/Zod/Vitest), **extending
  the existing `tower/` — NOT re-platforming.** A (inherit Python BrowserGym/AgentLab) and C (Docker
  sidecar-per-tool) both scored buildability 3/10 for a solo TS builder: A forces learning Python +
  discarding the working TS tower; C's containerized Chromium *changes the fingerprint it's measuring*
  and reverses ADR-0004 (host-primary). B wins with two grafts that fix its validity holes:
  - **The crux (grafted from A): two boundaries.** CAPABILITY is measured *through* the adapter
    (normalize the outcome state, tool-agnostic). DETECTABILITY is measured *around* it — the tool
    launches & drives its OWN browser; the Tower is a CONTROL channel only, never on the browser↔site
    data path. Detector pages **self-report their verdict by per-run nonce** to an out-of-band
    127.0.0.1 sink; **no Playwright/CDP attach to the measured browser during an L2 run** (attaching
    would itself emit `Runtime.enable` and pollute the measurement).
  - **Wire transparency (grafted from C):** read JA3/JA4 via a **passive pcap/eBPF tap**, NOT a
    TLS-terminating proxy (no MITM, no root-CA install).
  - **Warmed-vs-cold confound fix:** byte-identical launch flags + identical connection mode on BOTH
    arms (else the debug-listener/attach footprint leaks into the very delta being measured).
  - Adapter = 4 shapes, one interface: HTTP-driven (Feather), subprocess-CLI (browser-use/Skyvern),
    CDP-attach (nodriver/Stagehand), library-in-worker. Foreign assets (WebArena grader, FCaptcha,
    WASP) run as **version-pinned subprocess/HTTP graders, never imported.** Existing `tower/
    behavioral.ts` is PRESERVED as the L3 behavioral collector, not discarded.
  - **MVP (PR-1, ~1 week solo):** extend `tower/`; 2 adapters (Feather HTTP + browser-use subprocess);
    ONE detectability level (rebrowser `runtime_enable`, verdict self-posted by nonce, no attach); ONE
    security level (WASP-style comment injection, ASR k=3); aggregator v0 with Clopper-Pearson CIs +
    radar JSON. Honest failure = success. Full design + build sequence: `../2026-06-27-03-tower-design.md`.

- **D5 — Data & knowledge architecture (Strand 4, 2026-06-27; 6 of 7 survived; audit measured, not guessed).**
  - **Results store: JSONL-in-git is TRUTH; SQLite is a rebuildable, gitignored read-index** over it
    (`tower/results/*.ndjson` committed; `tower/data/*.db` gitignored, rebuilt by a batch indexer). This
    INVERTS Strand 3's SQLite-primary proposal — the "SQLite-primary + JSONL-sidecar like Metriq/AgentLab"
    claim was **refuted 3/3** (the precedent is factually false; Metriq is git-JSON with no DB). CI math
    stays in TS wrapping `@stdlib/stats-binomial-test` (SQL can't do inverse-incomplete-beta); store
    integer `(passes, n)` + a `statVersion` pin; leaderboard fold SUMs raw `(k,n)` then recomputes CP
    (never average stored CIs). Artifacts path-referenced in gitignored `tower/runs/`. Graduate to DuckDB
    only at ~50k+ rows AND slow GROUP BY (implausible).
  - **Scoreboard: a static build-time projection over the JSONL → GitHub Pages**, Observable **Plot as a
    library** (NOT Observable Framework — upstream stalling), lockfile pinned. ⚠️ **CROSS-STRAND CONFLICT
    the final synthesis must resolve: DROP THE RADAR.** ECharts radar can't render CI bands (center-out
    fill) and Observable advises against radar charts — Strand 4 says use **time-series + small-multiples
    / parallel-coordinates with native CI bands** instead. This contradicts Strands 2 & 3 ("the radar is
    the primary artifact"). Synthesis decides: the *cap/det/sec profile* stays the headline concept; its
    *rendering* is small-multiples/parallel-coords with CIs, not a radar polygon.
  - **Corpus verdict: STAY ON GREP + a structured index. Do NOT add embeddings/RAG/DuckDB/FTS.** Measured:
    185 curated docs (~310K words) + 130 unstructured — over the ~50 threshold but well-partitioned; the
    ~2-3MB corpus fits in memory, ripgrep is the maintained standard. Only firing trigger = **terminology
    drift** (gym 31 / gymnasium 19 / tower 13 / bench 12 for ONE concept; stealth vs detectability vs
    evasion; warmed vs cookie-mine vs authenticated). Zero-infra fix → finish the `gym→tower` rename across
    `docs/specs`/`docs/plans`/`blog`/`AGENTS.md` + add `docs/GLOSSARY.md`.
  - **Knowledge / no-context-window NOW-actions (cheap, build-phase or post-loop):** promote this decisions
    log to a standalone `tower/decisions.md` (D1…Dn index, grep-able by ID — currently buried in a receipts
    README); add a `tower/` section to `journal/docs-map.md`; codify `rg -l <kw> tower/ docs/ journal/
    context/` -first in AGENTS.md; the `GLOSSARY.md`. **Defer** SQLite FTS5 (a 2nd virtual table) to the
    3-grep / 50-receipt trigger; **never** embeddings/RAG/graph at this scale. Full detail:
    `../2026-06-27-04-data-knowledge-arch.md`.

- **D6 — Security / injection axis (Strand 5, 2026-06-27; all 7 survived — the most solid angle).**
  - **Attack taxonomy = 12 classes** borrowed (not invented) from AgentDojo / WASP / RedTeamCUA /
    InjecAgent / WebTrap Park / DoomArena / OWASP-ASI-2026: IPI visible/hidden(CSS/Unicode)/obfuscated,
    contextual exfiltration, unintended state-mutation, relay/second-order (agent relays an attacker
    payload into a downstream sink), etc. **One class EXCLUDED** — pure confidentiality-breach-via-agent-
    narration (no physical boundary crossing) is NOT objectively gradable; only classes with a physical
    observable (HTTP/DOM/file) become scored levels.
  - **Victim app = BUILD a purpose-owned TS/Node Fastify+SQLite "Juice-Shop-for-agents"** (survived 3/0:
    no existing env implements the SecurityHooks contract cleanly). Per-run **256-bit canary UUID** seeded
    into page content, checked across **4 boundary channels simultaneously** (HTTP egress sink, form field,
    agent final answer, DOM/file write). Deterministic per-run reset; isolation.
  - **Grader = ASR any-of-3 (k=3)** end-to-end (the score) **+ mandatory WASP intermediate "injection-
    obeyed" probe on every level** (the diagnostic that stops "security-by-incompetence" — a broken agent
    scored "safe" because it failed the task) + a no-attack counterfactual baseline. Deterministic, no LLM
    in the verdict.
  - **Ethics: own-arena-only** (attacks run ONLY against the Tower's own victim app, never real third-party
    sites); mirror the repo's existing anti-bot-testing policy; **coordinated/responsible disclosure** for
    any real vuln found in a tested tool (private report, embargo, CVE); no weaponizable exploits shipped in
    the public repo → a `tower/SECURITY-TESTING-POLICY.md`.
  - **MVP level order:** L1 WASP-style GitLab-comment IPI (Strand-3 PR-1) → L2 contextual exfiltration →
    L6 relay/second-order. Full detail: `../2026-06-27-05-security-injection-axis.md`.
