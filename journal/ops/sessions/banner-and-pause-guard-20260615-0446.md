# Session — Navigation-survivable resume banner + human-in-control guard (+ security flag)

**Date:** 2026-06-15 04:46 (STOP)
**Phase:** 4a / Feather v1 → v2 spine (Gate A fully done). Desk: `browser`.
**Commit:** `2c7773a` on `dev`.

## Done this session

- **Navigation-survivable resume banner (shipped, TDD).** A real navigation replaces the document
  and destroyed the on-page Resume banner, stranding the human (the exact pain on a multi-page
  Google login). `await-human` now re-injects the banner on each new main-frame document via a
  `domcontentloaded` listener (detached on resolve; `showBanner` is idempotent so no double-inject;
  the DOM-flag poll reads the live page so it picks up the re-injected banner automatically). Chose
  `domcontentloaded` over raw `framenavigated` because it guarantees `document.body` is present for
  injection. Files: `src/commands/await-human.ts`, integration + unit tests.
- **Human-in-control guard (discovered live, then shipped, TDD).** While testing the banner I drove
  an automated `navigate` and yanked Roi out mid-login. Root cause: `await-human` means "human is
  driving" but Feather didn't *enforce* it. Fix (Roi chose "block page changes"): while a pause is
  active, agent-initiated page-mutating commands (navigate/click/type/press/select-option; `dismiss`
  via its internal click) are refused with **`HUMAN_IN_CONTROL` (HTTP 409)**; read-only commands
  (observe/snapshot/screenshot/wait/tabs/health) stay allowed. **Page-scoped** — a pause on one tab
  doesn't freeze another. New: `pause-registry` records each pause's `pageId` + exposes
  `isPagePaused`/`assertPageNotPaused` (throws `HumanInControlError`); guard wired into the 5
  mutating handlers; `HUMAN_IN_CONTROL: 409` mapped in `routes.ts`.
- **Proven live on scratch** (cleaned scratch cookies → logged out → real Google login, Hebrew UI —
  the motivating scenario): banner followed across the login; an agent `navigate` during the pause
  was **refused with `HUMAN_IN_CONTROL` and the page did not move**; resume via banner click worked
  (`resumedBy: "human"`). Cleaned up: session closed, server stopped, lock free.
- **Gates:** tsc clean; **366 unit** (registry page-guard cases + await-human re-inject cases);
  **await-human integration 9/9** (incl. block-during-pause + read-only-allowed + resume-then-allowed).
  Pre-existing `attach-cdp` viewport integration failure is unrelated (environment-dependent on this
  Wayland box; confirmed it fails identically on a clean tree).
- **Committed** code + tests as `2c7773a` (journal edits deliberately left for this /stop).

## ⚠️ Security finding (Roi flagged) — TOP next-session priority

Roi found **real test credentials in the remote repo** (it's built in the open). Scoped:
- **Password `Danino1265`** (scratch IG) — was in `journal/context/active.md`, `journal/log.md`,
  `journal/archive/next/2026-06-11/1430-stop-bundle-fable-workflow.md`. **Redacted from the working
  tree this session** (`[REDACTED-PW]`), but **still present in pushed git history.**
- **`roionly9` / `roionly9@gmail.com`** (scratch Gmail/IG handle + email) — 47 hits across **24
  tracked files** (docs/v1_wrap, journal, research, skills, tasks).
- **`feather_test_roi`** (old scratch IG username) — 69 hits across **38 tracked files**.

**Working-tree redaction ≠ remediation.** Real fix requires: (a) **git history rewrite** (git-filter-repo
/ BFG) + force-push, and (b) **rotate the credential** — the IG password is already public, so treat
`roionly9` as compromised and change its password regardless of the scrub. Decide with Roi whether
the usernames/email need full scrubbing or only the password (test accounts, but his call).

## Left unfinished / open

- The security scrub above (history rewrite + rotation + decide username/email scope).
- v1 small leftovers still parked: prune duplicate "Rosh Hashana" Sep-12 events on scratch Google;
  H3 viewport acceptance check (does 1280×800 headed render IG-class desktop); remove dead scripted
  `run_h3` from `examples/showcase.sh`.
- "Agent should *feel* the resume instantly" — no code needed: Feather already emits it (the blocking
  `await-human` call returns on resume + a `human.pause.resolved` SSE event). My test harness wrote
  the result to a file and didn't poll it; an integrated agent feels it natively.

## Next concrete action

Roi's pick: **(2) v1 leftover cleanup + a security check**. Treat the **security scrub as #1**
(creds in remote/history), then the v1 leftovers. After that, **5a — Identity Model** (first real
consumer of Gate A; plan `docs/specs/2026-06-07-identity-model-plan.md`).

## Decisions

- Banner re-inject via `domcontentloaded` (not `framenavigated`) — body-present guarantee.
- Guard scope = block page-mutations, allow read-only, page-scoped (Roi: "block page changes").
- Cleaned scratch by deleting `Default/Cookies` (targeted logout), not a whole-profile wipe.
- No blog entry this session (owed line appended to `blog/_pending.md`).
- Redact the literal password now; defer the full history scrub + rotation to next session.

## Roi quotes (verbatim)

- "resume-banner fix"
- "clean the scratch coockies and lets see if it works by menual testing"
- "but i didnt yet logged in you took me out mid login"
- "do we need to fix the behaveier for what happend wont happen again?"
- "i logged in and pressed the banner, why dont you 'feel' it?"
- "2+security check - no profile name and passwords should be on the remote repo, i found there are
  in the remote the name and password for instagram + the roionly9 gmail adress"
