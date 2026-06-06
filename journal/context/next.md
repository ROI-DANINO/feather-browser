# Next — Context Bridge

## 2026-06-06 22:14 | Screen Recorder Setup — Wayland/Niri compatibility

### Done
- Identified environment: **Niri** compositor on **Wayland**.
- Audited system for screen recorders; found only `ffmpeg` and `Obsidian` (Flatpak).
- Recommended **Kooha** (GUI, Flatpak) or **wf-recorder** (CLI, DNF) for Wayland compatibility.
- Provided install commands to the user.

### Unfinished / open threads
- **Record the Hero Demo**: Gated by user installing a screen recorder.
- Inbox: `journal/raw/_inbox/anchor-browser-research-brief-2026-06-06.md` still unprocessed.

### Decisions
- User will manually install the recorder to avoid agent-driven sudo/flatpak install.

### Next action
Run `npm run demo:hero` once the user confirms their screen recorder is ready.

---
## 2026-06-06 21:00 | Burner Demo — single-command launch + auth polling fix

### Done
- Audited Gemini's hero demo hardening work; found critical bug in `continuity.ts` polling loop.
- **Fixed auth polling bug** (`continuity.ts`): was navigating to `accounts.google.com` directly (no `continue` param → after login Google went to google.com, Compose button never found → 5-min timeout). Fixed: polling loop now navigates to `targetUrl` (Gmail) each iteration — Gmail's own redirect handles showing the login page with the correct `continue` param.
- **Added `npm run demo:hero`** (`scripts/demo/run-hero-demo.sh`): single command, starts RAM-backed server (`FEATHER_DIR` in tmpfs), waits for endpoint.json, runs demo, kills server on exit.
- **Fixed stale endpoint.json race**: shell script now deletes endpoint.json before starting server so a leftover file from a prior run doesn't cause "fetch failed".
- Removed `loginUrl` from `ContinuityConfig` interface and `hero-chatgpt-gmail.ts` call — no longer needed.
- Removed `warm-session` prerequisite from README hero demo section.
- Updated unit tests (3 tests: fast path, polls-until-detected, timeout).
- Fixed premature `[x]` on LinkedIn debut task in `tasks.md`.
- 215 unit tests + tsc 0. Verified live — `npm run demo:hero` works, shows account chooser, detects login, proceeds. Committed + pushed `a2e9ec9` on `origin/dev`.

### Unfinished / open threads
- Inbox: `journal/raw/_inbox/anchor-browser-research-brief-2026-06-06.md` still unprocessed.

### Decisions
- ChatGPT login not handled in `ensureHumanAuth` — guest mode is fine for the demo.
- Two-terminal setup eliminated; single `npm run demo:hero` is the public-facing entry point.

### Next action
Record the hero demo (`npm run demo:hero`, screen-capture the live run) → post to LinkedIn.

---
## 2026-06-06 20:30 | Hero Demo Hardening & Superpowers Installation
- **Done:**
  - Implemented `ensureHumanAuth` in `scripts/demo/continuity.ts` to handle human-in-the-loop login during agent runs.
  - Integrated continuity check into `scripts/demo/hero-chatgpt-gmail.ts` (Google/Gmail only, ChatGPT blind).
  - Fixed `scripts/demo/hero-chatgpt-gmail.ts` to respect `FEATHER_DIR` and `FEATHER_WARM_WORKSPACE` environment variables, enabling isolated "burner" profile demos.
  - Installed `@obra/superpowers` extension for Gemini CLI (14 new skills).
  - Updated `README.md` with Hero Demo and Continuity feature details.
  - Verified continuity logic with unit tests (`tests/unit/scripts/continuity.test.ts`).
- **State:**
  - Burner directory prepared at `/run/user/1000/feather-demo` (RAM-backed, disposable on reboot).
  - User requested `/next` to verify work in a fresh conversation.
- **Next Action:**
  - User to run `/skills reload` in the fresh session.
  - User to verify the burner profile demo flow:
    1. Start server: `FEATHER_DIR="/run/user/1000/feather-demo" npm run dev`
    2. Warm burner: `FEATHER_DIR="/run/user/1000/feather-demo" FEATHER_WARM_WORKSPACE=demo npm run warm-session`
    3. Run Hero Demo: `FEATHER_DIR="/run/user/1000/feather-demo" FEATHER_WARM_WORKSPACE=demo npx ts-node scripts/demo/hero-chatgpt-gmail.ts`
  - Record the Hero Demo for LinkedIn debut.
