# Strand 4 — Data & Knowledge Architecture

Two small data problems, neither of which needs a "platform." (1) The **bench results store**: tens-to-low-thousands of append-only scored rows over the project's life — a single-file, git-versioned store, not a database server. (2) The **project knowledge corpus**: ~185 curated docs that grep still handles deterministically — an index + ripgrep, not embeddings. This strand right-sizes both, names the exact volume at which each graduates, and — load-bearing — **corrects** the original Strand-4 proposal where the adversarial pass debunked it (the "SQLite-primary + JSONL-sidecar, like Metriq/AgentLab" precedent was factually false).

## Bench results store

**Decision: an append-only JSONL log committed to git is the source of truth; SQLite is a disposable, gitignored, rebuildable read-index over it.** This validates Strand 3's "append-only RunRecord, storage-agnostic `ResultSink.put(record)`, artifacts-on-filesystem-by-path" spine — but **inverts** the primary/derived relationship the Strand-4 research originally proposed. The original recommendation (SQLite `.db` as primary, JSONL as a committed sidecar, justified by Metriq/AgentLab) was **refuted 3/3** on durability and prior-art: the cited precedents do the opposite (see Stress-test), and a lone gitignored binary as truth is a single-point-of-loss with no git diff/audit trail.

What survives, concretely:

- **Truth = append-only NDJSON** (one RunRecord object per line) committed under `tower/results/`. Git gives versioning, backup-on-push, human-diffable audit, and reproducibility for free — the exact properties a binary `.db` cannot offer. A corrupt or deleted index is regenerated from the log; the log is never regenerated from the index.
- **SQLite (`better-sqlite3`, WAL) is the query index**, gitignored in `tower/data/`, rebuilt from the JSONL by a batch indexer. It exists only because the leaderboard fold (`GROUP BY tool × level`, time-series, CI comparison) is genuinely relational and SQL is convenient — not because it owns data. This keeps SQL ergonomics without making the binary precious. (At today's 3-row reality it's optional; add it when the in-memory TS fold over JSONL gets tedious, ~200+ rows.)
- **RunRecord schema home**: one immutable row per `agent_version × tower_version × N_rep` batch, carrying its own CI and pinning `taskSetHash / graderVersions / envFingerprint / ipClass / handoffMode` (per Strand 3, `tower/research/2026-06-27-03-tower-design.md:139`). **Add a `statVersion` pin** (`ciMethod=clopper-pearson`, `alpha=0.05`, lib version) so CIs are reproducible from raw counts. **Store integer `(passes, n)`, not only a REAL `pass_rate`** — recovering `k` from `round(rate·n)` is a derived-from-derived smell.
- **CI math stays in TypeScript** (survived 3/3). Clopper-Pearson bounds are inverse-incomplete-beta quantiles, which stock SQLite/Postgres SQL cannot compute; the engine choice therefore has **zero bearing on statistical correctness**. Two guardrails the stress-test surfaced: (a) **wrap a vetted library** (`@stdlib/stats-binomial-test`, which implements exactly `betaQuantile(α/2, x, n−x+1)` / `betaQuantile(1−α/2, x+1, n−x)`) — do **not** hand-roll the beta inverse; (b) the leaderboard fold must **SUM raw `(passes, n)` across rows and re-run CP in TS** — never average the stored per-row CIs (that is statistically wrong). Integer SUM is engine-exact, which is *why* "zero bearing on engine" holds.
- **Artifacts** (PNGs, future pcaps/HAR/trajectory tapes) stay on the filesystem referenced by path under gitignored `tower/runs/` — **never blobs in the DB** (`.gitignore:46-47`).
- **`tower/results.md` becomes a generated projection**, not a hand-edited table. Once the log exists, regenerating the scoreboard markdown from it (with a CI check that fails on drift) prevents the committed index from silently diverging from truth.

**Graduation triggers (named):** add the SQLite read-index when the TS fold over JSONL becomes painful (~200+ rows, multi-pass). Migrate SQLite→Postgres only on a genuine multi-writer/concurrency need (not present: the runner is sequential, single-writer). Reach for **DuckDB/Parquet only at ~50k+ rows AND measurably slow GROUP BY** — implausible at a handful of tools × dozens of levels × N_rep=10 within this project's life. The OLTP/OLAP framing in the original research was the wrong axis (the query *is* aggregation-shaped); the real reason SQLite wins is **scale** — at thousands of rows any engine scans the table in microseconds, so DuckDB's columnar advantage never fires while its costs are paid up front.

| Option | Sizing | Verdict |
|---|---|---|
| **JSONL-in-git (truth) + SQLite read-index** | 1 → ~50k rows; correct now | **Recommended** |
| SQLite `.db` as primary store | works, but binary doesn't diff, single-point-of-loss without backup ritual | Demote to rebuildable index only |
| DuckDB / Parquet | 5M–50M-row OLAP; columnar win starts ~1M rows | Defer to ~50k+ rows AND slow GROUP BY |
| Postgres / Timescale | multi-writer, server ops | Only on real concurrency need; not now |
| Document store (Mongo) | server, no SQL fold, no append-WAL | Wrong tier at any Tower scale |

## The scoreboard (money-shot)

**Decision: a pure build-time static projection over the committed JSONL — render charts from the log, deploy static to GitHub Pages.** The "store-is-truth, site-is-a-read-only-snapshot, static-gen-not-a-live-server" architecture **survived** (the data is append-only and refreshed only when a bench run executes — freshness window is hours/days, so a live-query server is the over-engineered choice). Two refinements the stress-test forced:

- **The host is *a build step*, not necessarily Observable Framework.** Framework is TS-native and Pages-deployable, but the adversarial pass flagged a real durability signal: upstream is **stalling** — last release v1.13.4 (March 2025, ~15 months quiet), Observable Cloud deploys discontinued Oct 2025, public "maintenance mode?" threads, vendor pivot to Notebooks 2.0. The **DuckDB-WASM rationale is also over-spec** for tens-to-thousands of rows that fit in one inline JSON. Right-sized path: render from committed JSON/CSV with **Observable Plot as a library** inside a thin Vite (or plain Node) build script — the static HTML/JS output survives even if any framework freezes, and the lightest valid form is close to the committed-markdown scoreboard already in `tower/results.md`. Evidence.dev is a maintained same-niche alternative if a fuller BI-as-code surface is later wanted.
- **Drop the radar; the radar premise was refuted.** Apache ECharts radar does **not** natively support CI area-bands — `areaStyle` fills center-outward to the data line, not *between* an upper and lower bound, so a CI band needs the same two-polygon overlay hack as anywhere else (apache/echarts#12592). Observable themselves publish ["avoid radar charts"](https://observablehq.com/blog/avoid-radar-charts) (axis-order distortion, meaningless connecting lines). The honest cap/det/sec view is **small multiples / grouped bars / parallel coordinates** — all native Plot marks with **native CI band marks** (`areaY` with `y1`/`y2`), no projection trick, one library. The **time-series view** (`tool × level × score over time`) is native Plot with native CI bands too. This keeps the scoreboard to a single charting dependency.

Real leaderboard prior art to mirror (rendering pattern, not infra): **SWE-bench** (`leaderboards.json` → Jinja2 → GitHub Pages — adopt the JSON-data-export pattern regardless of renderer) and **SkillsBench** (84 tasks × 11 domains, the closest live agent-leaderboard analogue to the cap/det/sec axes). Both are static projections over a structured data file — exactly the shape here.

**Pin the lockfile.** The only way a static projection drifts is if it bakes a *snapshot* decoupled from the log, or if chart-lib versions float — render from the JSONL and commit the lockfile, and reproducibility holds.

## Corpus audit (where we actually stand)

Measured 2026-06-27, not estimated:

- **Curated docs: 185 files (~48K lines, ~310K words)** — `docs/specs` 74, `docs/plans` 19, `research/` 21, `blog/` 28, `docs/superpowers` 10, `tower/research/` 7, roadmap/commands/context/work/inbox + 8 top-level. (Broader counts cross-checked: ~226 files/325K words for docs+research+blog; 468 git-tracked md/txt / ~514K words repo-wide; 77,825 total markdown lines.)
- **Unstructured artifacts: 130 files** (`journal/ops/sessions` 70, `journal/raw/archive` 33, `journal/archive` 19, `docs/sessions` 8; ~102K words) + 36 borderline test-log files.
- **Bench data: none yet** — `tower/runs/` holds 4 PNG screenshots, zero structured RunRecord rows. The store problem is entirely forward-looking.

Each trigger tested against reality:

| Trigger | Firing? | Evidence |
|---|---|---|
| ~50-curated-doc threshold | Exceeded 3.7× **but benign** | 185 files, well-partitioned into named dirs; single-concept grep within a known path is still deterministic |
| **Terminology drift** | **FIRING** | gym 31 / gymnasium 19 / tower 13 / bench 12 = 75 doc-hits for *one* concept; a search for `tower` alone misses ~80% |
| **3-grep rule** | **FIRING** (gym/tower) | full coverage needs 4 variants; borderline for stealth/detection (stealth 165, bot-detection 64, detectability 16, fingerprint 75) |
| Context overflow | NOT firing | active.md 102 lines, tasks.md 60, phase.md 17 |
| Unstructured volume | NOT firing | 70 session files = 5,305 lines; nobody queries them by content |

The ripgrep maintainer's own bar confirms the verdict: indexing only pays off when the corpus *doesn't fit in memory*; ~325K words ≈ 2–3 MB fits in memory hundreds of times over, so plain ripgrep is the maintained standard here (BurntSushi, ripgrep#1497).

**Verdict: stay on grep + a structured index.** Do NOT add embeddings, DuckDB, or an FTS index. The only firing trigger is terminology drift, fixed at zero infra cost by two actions: **(1)** finish the `gym → tower` rename across `docs/specs`, `docs/plans`, `blog`, `AGENTS.md` so one grep finds everything; **(2)** add a ~20-line `docs/GLOSSARY.md` mapping each synonym cluster (gym/gymnasium/bench/tower; stealth/detectability/evasion/fingerprint; warmed/cookie-mine/logged-in/authenticated) to its canonical term.

## Knowledge architecture — retrieval without the context window

The retrieval problem here is **navigation, not semantics**: future agents must land on the right file in one or two grep steps, not discover unknown concepts. The whole scheme is designed so **no agent ever needs the corpus loaded into its context window** — it greps a maintained surface, reads only the 1–2 files that match, and follows pointers. Adopt now / defer / never:

**Adopt NOW (Tier 0–1, zero infra):**
1. **Extend `journal/docs-map.md` with a `tower/` section** listing the `tower/research/*.md` digests and the decisions log as first-class authoritative surfaces (currently a gap — they're not indexed).
2. **Promote the decisions log to standalone `tower/decisions.md`** — one row per decision (`D1…Dn`), keyed by ID, each pointing to its digest + raw receipts. Today D1–D4 are buried in `tower/research/raw/README.md`, invisible to a repo-level `rg decisions`. This is the **receipts pattern**: a grep-able index of decision IDs that never requires reading the raw JSON to find one.
3. **Codify the ripgrep-first contract in `AGENTS.md`**: `rg -l <keyword> tower/ docs/ journal/context/` → read only the hits. Deterministic, zero API cost, no ranking ambiguity.
4. **`docs/GLOSSARY.md`** (above) so synonym drift doesn't defeat exact-term grep.

**How it stays in sync:** the index is text in the same git repo, corrected at every phase boundary by the existing "leave the docs true" reconcile ritual. The FTS indexer (when added) rebuilds on the same `post-commit` hook that refreshes graphify — derived, never authoritative. Graphify already covers code-wiring and **correctly fences out all markdown** (`.graphifyignore`); keep it that way.

**DEFER (Tier 2) — SQLite FTS5, with an explicit trigger:** add it as a **second virtual table in the RunRecord SQLite DB** (zero new dependency, BM25 ranking built in) **only when** a session routinely needs 3+ grep variants for one concept *after* the glossary/rename, **OR** `tower/research/raw/` exceeds ~50 JSON receipt files and agents need to query raw transcript content, not just digests. Practical ceiling ~10k files — well beyond this project's horizon.

**NEVER at this scale — embeddings/RAG and a formal knowledge graph.** Embeddings predictably fail on exactly this corpus's vocabulary: exact identifiers like `ADR-0004`, `D3`, `ASS_cap`, `WD delta`, `bm25()`. They add an embedding model/API, a vector store, chunking decisions, and version-drift — for negative recall benefit on identifier lookups. A node/edge graph is also unwarranted: `docs-map.md` + `tower/decisions.md` + the ADR README **already encode the graph as flat markdown** (ADRs cross-reference, decisions carry `SUPERSEDED by` markers) at lower cost with deterministic grep. The crossover for either is ~200+ interconnected decisions with multi-hop relational queries — not this corpus. (If synonym discovery is ever wanted, use embeddings as a *one-time vocabulary bootstrap* to populate the glossary, then throw them away — never as the production retriever.)

## Stress-test results (honesty pass)

| Decision | Result | Why |
|---|---|---|
| RunRecord workload fits SQLite, not DuckDB | **SURVIVED 3/3** | Right-sized, durable, named graduation path. Correction: the win is **scale**, not "OLTP vs OLAP" — the query is aggregation-shaped; at thousands of rows DuckDB's columnar engine never earns its cost. |
| Clopper-Pearson CIs in TS, not SQL | **SURVIVED 3/3** | SQL can't compute inverse-incomplete-beta; engine choice is orthogonal to correctness. Guardrails added: re-fold raw `(k,n)` (don't average stored CIs); wrap `@stdlib`, don't hand-roll; pin `statVersion`. |
| "SQLite-primary + JSONL-sidecar, like Metriq/AgentLab" | **REFUTED 3/3** | **Precedent is false** — Metriq is version-controlled JSON files with *no database*; AgentLab is a home-dir file tree (pickle+json), no SQLite, not git-committed. Both argue *against* a DB in the durability path. Correct inversion: **JSONL-in-git is truth; SQLite is a rebuildable index.** |
| Scoreboard = pure build-time static projection | **SURVIVED (2 confirm / 1 refute)** | Architecture sound; the refute targeted "SQLite *is* truth" — resolved by making truth the committed JSONL and the site a disposable snapshot. |
| Observable Framework is *the* host | **MIXED (1 confirm / 1 refute / 1 uncertain)** | Stalling upstream + over-spec DuckDB-WASM rationale. Demoted to "a build step using Plot-as-library, render from committed JSON, lockfile pinned"; static output survives framework freeze. |
| Plot + ECharts radar with native CI bands | **MIXED (2 confirm / 1 refute)** | ECharts radar does **not** natively band CIs (center-out fill); radar is the wrong chart. Replaced with Plot small-multiples/parallel-coords + native `areaY` bands — one library. |
| Stay on grep+index (don't graduate the corpus) | **SURVIVED 3/3** | 2–3 MB corpus fits in memory; ripgrep is the maintainer-endorsed standard; semantic gap already covered by the index + NotebookLM pack. |

## Handoff

What the build phase and the final synthesis should implement from this strand:

- **Store:** an append-only **NDJSON RunRecord log committed under `tower/results/`** as the single source of truth; a **gitignored `better-sqlite3` (WAL) read-index** in `tower/data/`, rebuilt from the log by a batch indexer on the `post-commit` hook. RunRecord pins include `statVersion`; store integer `(passes, n)`. Artifacts stay path-referenced in gitignored `tower/runs/`. `tower/results.md` becomes a **generated** projection with a drift-check.
- **CI math:** TS pure functions wrapping `@stdlib/stats-binomial-test`, golden-tested against `scipy.stats.binom`; leaderboard fold sums raw `(k,n)` then recomputes CP.
- **Scoreboard:** a thin **build-time static projection** (Plot-as-library, render from the JSONL, lockfile committed) → GitHub Pages; **time-series + small-multiples/parallel-coordinates with native CI bands** (no radar, single chart lib); export a `leaderboards.json` SWE-bench-style.
- **Knowledge scheme:** extend `journal/docs-map.md` with a `tower/` section; create standalone `tower/decisions.md` (D1…Dn receipts index); add `docs/GLOSSARY.md`; codify `rg -first` in `AGENTS.md`; finish the `gym→tower` rename. **Defer** SQLite FTS5 (second virtual table) to the 3-grep / 50-receipt trigger; **never** build embeddings/RAG/graph at this scale.

## Sources

- https://github.com/WiseLibs/better-sqlite3
- https://sqlite.org/datatype3.html — REAL = IEEE-754 binary64 (lossless round-trip vs JS number)
- https://sqlite.org/lang_mathfunc.html — no inverse-incomplete-beta in core SQL
- https://sqlite.org/fts5.html
- https://sqlite.org/locrsf.html — SQLite as a Library-of-Congress recommended format
- https://duckdb.org/docs/current/connect/concurrency — DuckDB single-writer, recommends SQLite/Postgres for transactional/point workloads
- https://duckdb.org/2024/06/03/announcing-duckdb-100 — storage-format stability only since v1.0 (June 2024)
- https://posthog.com/blog/duckdb-vs-sqlite — DuckDB advantage targets millions of rows
- https://motherduck.com/learn/duckdb-vs-sqlite-databases/
- https://www.npmjs.com/package/@stdlib/stats-binomial-test — Clopper-Pearson as a pure function (betaQuantile)
- https://en.wikipedia.org/wiki/Binomial_proportion_confidence_interval
- https://github.com/unitaryfoundation/metriq-data — file-based version-controlled JSON, no SQLite
- https://github.com/ServiceNow/AgentLab — per-experiment file dirs, no SQLite, not git-committed
- https://observablehq.com/framework/ + https://github.com/observablehq/framework/releases — last release v1.13.4 (Mar 2025)
- https://observablehq.com/blog/avoid-radar-charts
- https://github.com/apache/incubator-echarts/issues/12592 — radar CI band requires overlay hack
- https://echarts.apache.org/handbook/en/basics/release-note/v6-feature/ — ECharts 6.0 (Jul 2025)
- https://github.com/evidence-dev/evidence
- https://github.com/SWE-bench/swe-bench.github.io — leaderboards.json → Pages pattern
- https://www.skillsbench.ai/leaderboard — live agent leaderboard (cap/det/sec analogue)
- https://github.com/BurntSushi/ripgrep/issues/1497 — index only when corpus exceeds memory
- https://towardsdatascience.com/embeddings-arent-magic-... — RAG failure modes on exact identifiers
- https://atlan.com/know/knowledge-graphs-vs-rag-for-ai/
