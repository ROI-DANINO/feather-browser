# Session: The Fable workflow that put Feather on trial — and acquitted it

**Stamp:** 2026-06-11 ~14:30 · **Phase:** 4a / Feather v1 wrap · **Desk:** automation
**Commits:** `60ef4fd..235ebbb` on dev, pushed (10 commits: 8 code/test, 2 docs)
**Mode:** Fable dynamic workflow — 4 analyst/reviewer subagents + inline TDD execution; Roi
authorized full autonomy mid-run ("no need to gate with my aproval im going to sleep now");
internal adversarial reviews replaced his approval gate.

## What this session was

Roi's expanded `/workflow` ask, run end-to-end: (1) diff the two v1-wrap showcase runs and
re-classify every non-PASS, (2) derive what Feather misses, (3) write an implementation plan,
(4) implement it. Three parallel analyst agents (H3 socket forensics, transcript friction mining,
C4C toolset analysis) fed a corrected meta-analysis; an adversarial reviewer attacked the draft;
the surviving ★ items were built TDD and survived a second adversarial code review.

## Headline reversals (all artifact-verified — `docs/v1_wrap/META-ANALYSIS.md`)

1. **H3's "socket death" was the agent harness, not Feather.** The lone socket error is the Claude
   harness's own Anthropic-API failure envelope (`isApiErrorMessage: true`); all ~19 Feather calls
   succeeded; CDP was alive 83s before death and at the clean close after. The committed "~19
   stacked socket-closed errors" was a grep artifact (the agent was grepping `/proc` for `socket:`
   inodes itself). **P0 "CDP durability" evidence withdrawn.**
2. **H3 never liked or commented.** Zero type/press/dismiss calls — the "Like→Unlike flip" matched
   the errand PROMPT text embedded in the transcript. No real-world side effect ever existed;
   "Feather burned the IG session" is unfounded; account gone = cause unknown.
3. **The real H3 blocker was ours:** `viewport` accepted at session create and silently ignored in
   `chromium-headed-cdp` (`spawnAndConnect` never applied it) → IG tablet wall → the agent spent
   ~6 min reverse-engineering Feather's own source and was composing a raw CDP
   `Browser.setWindowBounds` when the harness connection died.
4. **M2 = environmental-rerunnable, cause undetermined.** The 2026-06-11 rerun (headed 200 +
   headless 200×3) proves the block is gone — but the original curl-200-vs-browser-503×4
   discrimination means "never fingerprint" can't be claimed either. The adversarial reviewer
   caught my draft overclaiming in Feather's favor; the doc now hedges. M2 is unusable as Stealth
   (5d) evidence in either direction.

## What shipped (plan: `docs/specs/2026-06-11-v1-wrap-gap-fixes-plan.md`)

- **fix(headed-cdp):** viewport honored via `--window-size` (fingerprint-faithful; no Playwright
  emulation); proxy-on-headed now warns (`session.option.ignored`) instead of silently dropping.
- **feat(tabs):** `GET /v1/sessions/:id/tabs` enumeration (the 404 H2 hit).
- **feat(click):** best-effort `newPageId` popup signal; measured that the page event usually
  lands AFTER the click response → no grace-wait tax; tabs list = ground truth (the /dismiss
  signal-vs-ground-truth pattern).
- **feat(extract):** flat `{fields}` shape accepted; `type` defaults text / infers attribute;
  `type:"value"` reads input values (kills H1's screenshot detours). `/evaluate` deliberately
  NOT built — deferred to v2 Gate A (ADR-0010).
- **fix(close):** disposable rm with `maxRetries`; cleanup failure logs `profile.cleanup.failed`
  instead of failing the close (the ENOTEMPTY that hit 2/7 teardowns).
- **feat(observability):** every POST action traced as `action.completed` (name + status ONLY,
  no bodies — pinned by a no-leak test); `GET /v1/sessions/:id/health` answers
  agent-died-vs-browser-died in one call.
- **docs/skills truth pass:** api-reference (incl. the long-stale browserMode enum), playbook
  (screenshot = artifact descriptor; sanctioned vision fallback), both operator skills.

## The review that earned its keep

The adversarial code reviewer **empirically proved** my new action-log hook wrote files for
unauthenticated requests (401s and framework 404s → arbitrary-named JSONL files; inode DoS;
traversal checked, not exploitable). Fixed: 401-skip + registered-session gate, regression test
pins all three vectors. Minors fixed too: quarantine-rename now logs failures; concurrent-click
caveat documented on newPageId.

**Gates:** tsc clean · 301/301 unit (was 280) · 79/79 integration (was 73).

## Open / next

- **`/blog` v1 finale** — now 4 owed lines incl. this session; richest material yet.
- **v2 Gate A planning pass** (Session 5.0.0, ADR-0010) — fresh session, planning-first.
- Prune duplicate Sep-12 "Rosh Hashana" events on scratch Google.
- H3 viewport acceptance check (does 1280×800 headed render IG desktop?) — fold into the next
  warmed-IG errand; the counterfactual was never tested.
- `run_h3` retired in principle; dead code still in `showcase.sh` (remove when the suite is next
  touched).

## Quotes

- "did you understend the /dynamic-workflow ?"
- "i trust yo to implament good changes, no need to gate with my aproval im going to sleep now"
- "use the graphify mcp and tools"
- (prior chat) "i dont like the test script the whole point is the agent doing it autonomosly"
- (prior chat) "i heard fable is very aouti=onomus and /workflow sounds like real fun"

## Consumed bridge entries

5 entries (2026-06-10 12:48 → 2026-06-11) archived to
`journal/archive/next/2026-06-11/1430-stop-bundle-fable-workflow.md`.
