# Next — Context Bridge

---
## 2026-06-06 03:11 — Anchor Browser product-reference research (autonomous run)

### Done
- Processed the inbox brief `journal/raw/_inbox/anchor-browser-research-brief-2026-06-06.md`
  (arrived via the remote-dev pull this session, commit `c5d68ba`).
- Ran an autonomous, primary-source research pass on Anchor Browser + a **ground-truth SDK probe**
  (unpacked `anchorbrowser@0.16.3` in a throwaway worktree `crash/anchor-sdk-probe`; nothing installed
  or executed; worktree removed after).
- Wrote two reports → committed on crash branch `crash/anchor-research-2026-06-06` (`30cccb3`):
  - `research/2026-06-06-anchor-browser-product-reference.md` (full 13-section brief output).
  - `research/2026-06-06-anchorbrowser-sdk-probe-notes.md` (raw SDK evidence).
- **Merged → `dev` (fast-forward `c5d68ba..30cccb3`), pushed `origin/dev`, deleted the crash branch.**
  Research only — no `src/` changes; `master` untouched.

### Key findings (see report §1)
- Marketing ≫ docs: "Anchor Chromium", "OmniConnect", "Web Action Cache" are brand names; docs map them
  to a generic specialized Chromium, an Embedded End-User Auth UI, and Tasks+Generation+Demonstrations.
- Architecture **verified in shipped code**: cloud browser = CDP-over-WebSocket, SDK attaches Playwright
  (`connectOverCDP`) — same control model as Feather's local `spawnAndConnect`. Cloud-vs-local =
  deployment, not mechanism. Their "Official Headful Browser Environments" validates our headless self-test.
- Identity model (Application→Identity→attach; human-logs-in/agent-inherits) = direct Cookie-Mine parallel.
- 12X/80X/23X are **unverified vendor claims** (no public benchmark entry).
- Stealth has *no documented mechanism*; the responsible idea pair = minimal-CDP-surface + Web-Bot-Auth
  (RFC 9421 declared-good-bot, the opposite of stealth). Captcha/Web-Unlocker = ToS/abuse-flagged.

### Unfinished / open threads
- **Report §12 has 5 open questions for Roi** (determinism-layer spike? deeper anti-detection spike?
  Web-Bot-Auth posture? identity-model→Vault influence? promote any of §10 into a `docs/specs` ADR /
  Phase-5 note, or keep as reference?). All deferred to Roi — none block anything.
- The inbox brief file still sits in `journal/raw/_inbox/` (it's on `dev`). Left in place — clearing it
  is the inbox-lifecycle ritual's call, not this research pass.

### Decisions
- Kept this strictly research-only per the brief — no Feather roadmap edits, no feature-by-feature compare.
- Pushed to remote `dev`, not `master` (research is not a master-milestone; per dev/master policy).

### Next action
The pre-existing trajectory is unchanged and still owns "next": **Roi's call = merge `dev`→`master`**
(milestone graduation; `dev` verified stable as of the 2026-06-05 4a ship) → then LinkedIn debut polish
(separate session) → then Phase 4b (shell-stack joint call + GUI). The Anchor report is reference input
for those later calls, not a new work item.
</content>
