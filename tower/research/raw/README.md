# tower/research/raw — verbatim research receipts

This directory holds the **raw subagent outputs** behind the Tower research loop — the sources, the
findings, and the adversarial verdicts — **copied verbatim**, never rewritten or paraphrased. The
readable synthesized digests live one level up (`tower/research/2026-06-27-0N-*.md`); these JSON/MD files
are the receipts those digests compress.

**Principle (per Roi, 2026-06-27):** don't keep only the final synthesized result. Keep the sources,
the helpful/relevant findings, and the decisions — copied straight from what the subagents produced.
Rewriting loses detail, costs tokens, and reads as trust-me summary. Provenance over paraphrase.

## What's here — two receipt types per strand

- **`strand{N}-*-findings.json`** (or `strand3-design-{A,B,C}.md`) — the per-angle / per-design subagent
  outputs: every entry/option with its sources, fields, and rationale.
- **`strand{N}-verify-verdicts.json`** (or `strand3-judge-verdicts.json`) — the adversarial pass: each
  load-bearing claim stress-tested by 3 lenses, every verdict carrying full reasoning + source URLs +
  the survive/refuted tally.
- **`synthesis-critique.json`** — the completeness critic's findings on the final synthesis draft.

All extracted verbatim (`jq '.result.findings'` / `'.result.verified'`) from each workflow's returned
objects — no model in the path. The **full per-agent transcripts** (every web fetch, all reasoning) are
NOT copied here; they remain in the workflow transcript dirs (`…/subagents/workflows/wf_*/`) as forensic
fallback only.

## Strand index

| Strand | Digest (readable) | Receipts (verbatim) |
|---|---|---|
| 1 — Landscape + gap | `../2026-06-27-01-landscape-and-gap.md` | `strand1-sweep-findings.json`, `strand1-verify-verdicts.json` |
| 2 — Scoring methodology | `../2026-06-27-02-scoring-methodology.md` | `strand2-methodology-findings.json`, `strand2-verify-verdicts.json` |
| 3 — Tower design + adapter | `../2026-06-27-03-tower-design.md` | `strand3-design-{A,B,C}.md`, `strand3-judge-verdicts.json` |
| 4 — Data & knowledge arch | `../2026-06-27-04-data-knowledge-arch.md` | `strand4-data-findings.json`, `strand4-verify-verdicts.json` |
| 5 — Security / injection axis | `../2026-06-27-05-security-injection-axis.md` | `strand5-security-findings.json`, `strand5-verify-verdicts.json` |
| 0 — Final synthesis | `../2026-06-27-00-SYNTHESIS.md` | `synthesis-critique.json` |

## Decisions

The decisions log (D1–D6) was **promoted out of this receipts README to `tower/decisions.md`** (2026-06-28)
so it's grep-able at the tower root. → **[`../../decisions.md`](../../decisions.md)**. The full
tie-together is the synthesis capstone `../2026-06-27-00-SYNTHESIS.md`.
