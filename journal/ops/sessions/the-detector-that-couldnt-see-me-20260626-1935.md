# Session — The Detector That Couldn't See Me (2026-06-26 19:35)

**Phase:** v1-ship-and-adopt → BOT GYMNASIUM direction. **Desk:** automation.
**Outcome:** Gym Step 1 BUILT & SHIPPED (pushed `origin/dev` `305b8b1..5e2f037`).

## Done this session
- **Designed → planned → built Step 1 of the bot gymnasium**, end to end:
  brainstorm → spec → plan → subagent-driven execution (fresh implementer + reviewer per task)
  → final whole-branch review → push.
- New top-level **`gym/`** (drives Feather over HTTP only — never imports `src/`):
  - `gym/classify.ts` — pure verdict logic; 5 unit tests; **"no score = FAIL"** baked in.
  - `gym/behavioral.ts` — launches a headed session, drives `bot.incolumitas.com`, waits past the
    15s scoring windows, parses `Your Behavioral Score:` from the snapshot, classifies, prints the
    verdict, saves a verdict-labelled screenshot, appends a row to `gym/results.md`.
  - `gym/results.md` — the scoreboard; first row written.
  - `package.json` script `gym:behavioral` (`ts-node gym/behavioral.ts`); `.gitignore` `gym/runs/`.
- **First honest run, live:** `UNSCORED → FAIL` vs `bot.incolumitas.com` (a detector Roi does not
  control). The behavioral classifier could not score Feather at all — clicks teleport, no cursor
  path. Verified against the saved screenshot; final review traced the snapshot/screenshot field
  names to `src/` to confirm the FAIL is **genuine**, not a misread-empty-field artifact.
- Docs: design `docs/specs/2026-06-26-gym-step1-behavioral-diagnostic-design.md`; plan
  `docs/plans/2026-06-26-gym-step1-behavioral-diagnostic.md`; live recon findings
  `docs/testing/gym-step1/recon-findings.md`.
- Gates: full unit suite **476/476**, typecheck clean. Blog **0026** written.

## Commits (on dev, pushed)
`e4207bf` design · `4ce4ce3` plan · `69aced8` classify · `d23fd9d` runner plumbing+recon ·
`2bbb67e` recon findings · `517ad99` drive+classify+record · `8851e39` first run recorded ·
`5e2f037` polish (path.relative + export comment).

## Decisions
- Step 1 is a **diagnostic, not a trophy** — target the detector that can *teach* (the behavioral
  gap), not ones Feather already passes (Fingerprint Pro / browserscan would just say "fine").
- **"No score = FAIL"** (Roi) — an unscoreable session is itself a detection tell.
- **3+1, agent reads its own verdict** — watch the headed window + keep a results row, one command.
- **Snapshot-parse, not a CSS selector** — chosen from live recon (the score is plain page text).
- **No synthetic interaction** — the missing signal IS cursor motion (the thing under test); 5d.2
  proved form-filling doesn't help.
- **Drive over HTTP, never weld into core** — Step 2's fable scoreboard reuses the same client.

## Left unfinished / NEXT
- **Step 2 — wire fable's eval harness (`project-fable/evals/`) as the scoreboard** (first thin
  White Lotus ↔ Feather integration; a wire, not a merge).
- The surfaced **upgrade target = mouse-motion** (what makes Feather scoreable / flips the dial from
  UNSCORED to a real number). Could be done before or after Step 2 — Roi's call.
- Final-review Minors NOT actioned (noted, non-blocking): no committed sample evidence in the
  scoreboard (PNGs are gitignored); same-line trailing-number could in theory misparse if incolumitas
  changes its placeholder format.

## Roi quotes (verbatim)
- "i want to test feather to know what to focus on whn i want to upgade it"
- "i think a no score is a bad score cuase it is a bad flag to have in this field"
- "yes 3+1, agent reads the verdict itself"
- "push it"

## Parked (unchanged)
- Real-account 2FA take (behind the pivot). Rotate/abandon leaked `roionly9` (outside repo).
- Stealth on real sites (5d) — CUT. Visual shell (4b) — deferred. fable→iroh merge — not first.
