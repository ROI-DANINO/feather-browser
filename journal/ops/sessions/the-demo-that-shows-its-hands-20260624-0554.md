# Session — The Demo That Shows Its Hands (2026-06-24 05:54)

**Phase:** v1-ship-and-adopt (reoriented 2026-06-24; target HYBRID; stealth CUT).
**Outcome:** Phase 3 ("Show it off — a NEW, stronger demo") SHIPPED & PUSHED to `origin/dev` (`8aedbbe`).
Reorientation roadmap Phases 0–3 now complete.

## Done this session
- **Full brainstorm → spec → plan → execute** for the hero demo v2, via subagent-driven development.
  - Spec: `docs/specs/2026-06-24-hero-demo-mfa-handoff-design.md` (`4e0ad81`)
  - Plan: `docs/plans/2026-06-24-hero-demo-mfa-handoff.md` (`1ee1cab`)
- **Task 1 (`57b0b37`):** `scripts/demo/continuity.ts` — replaced the silent console login-poll with the
  shipped `await-human` handoff (on-page Resume banner + `resumeOn` auto-resume + post-check guard).
  Dropped `pollIntervalMs`. Tests rewritten (`tests/unit/scripts/continuity.test.ts`, 3 pass). The
  demo's other legs (ChatGPT→Gmail errand) untouched; no `src/` change — reused the existing feature.
- **Task 4 (`fb58457` + fix `5b3a09f`):** `feather.md` — added a binary "Done when" column for v1/v2/v3.
  Cold review caught the v2 line smuggling a "no verify-challenge" promise (contradicts the cut-stealth
  decision); rewrote so a one-time challenge resolved via the handoff is a PASS, only a *persistent
  block* fails v2.
- **Task 2 — live gate: PASS (narrowed).** Recorded with Roi driving. Banner appeared on
  `accounts.google.com`, survived email→password navigation, auto-resumed on inbox load; verified from
  session log (`ses_78b9561e4b`) + frame-by-frame of the recording (`ses_ed45fe57d4`). Report:
  `docs/v1_wrap/hero-demo-v2/gate-report.md`. **No 2FA challenge fired (same-machine) → 2FA-page
  survival still unproven.**
- **Task 3 (`62dab64`):** recorded `demo-hero-mfa.mp4`. AI watched it (extracted frames) and reviewed
  for professionalism → trimmed messy head (prior-run console) + tail (recorder's own ffmpeg output),
  downscaled 2880→1280, CRF-compressed (quality-locked, not size-capped): **23M → 2.4M, ~49s**, crisp.
  Replaced `demo-final.mp4` (1.1M, removed from git). README hero section repointed. Wrote
  `scripts/demo/RECORDING.md` (runbook + re-record-only polish gaps).
- **Final whole-branch review** found 2 Important honesty gaps → fixed in `8aedbbe`: (1) committed the
  gate report (was missing); (2) softened README 2FA wording to conditional ("if Google challenges
  you" — it wasn't demonstrated); + trailing newline on the test file.
- Pushed `182b4e0..8aedbbe` to `origin/dev`.
- **Blog 0024** written ("The Demo That Shows Its Hands"); folded the owed Phase-2 version-number catch;
  `_pending` cleared.

## Left unfinished / next
- **NEXT SESSION = real-account 2FA take.** Run the demo on Roi's *actual* Google account (expected to
  trigger phone-tap verification) to prove the banner survives a real 2FA challenge *page* — the one
  thing this session's recording did NOT exercise. Test real / publish scratch.
- Optional: launch-grade re-record (opaque terminal, calm background, full terminal on screen — gaps
  listed in `RECORDING.md`).

## Decisions
- Show the handoff on the **human Google leg**, not an agent-driven second login (smaller, lower block
  risk, same feature).
- **Agent mouse/cursor → deferred to v3.** Feather teleports clicks; faking a cursor would be a rigged
  demo (testing-honesty).
- Video compression: **CRF (quality-locked), never a hard size cap** — keeps screen text sharp.
- Video weight: swap (remove old 1.1M, add new 2.4M) rather than pile on; `*.mp4` stays gitignored,
  hero video force-added (matches prior pattern).
- Honesty: the recording proves normal-login banner survival, NOT 2FA-page survival — said so in the
  gate report + README rather than letting the video imply it.

## Roi quotes (verbatim)
- "i want the actual demo that runs now but to show the mfa mechanizm"
- "i kinda want to add a mouse use for the agent, what do you think? maybe in v3."
- "i can login with my actual account (i think we stealthy enugh for this)... illstart with the scratch one i just wanted to note that and we will try it later"
- "can you watch it and give me a review? so it will look more proffesional"
- "demo-hero-mfa.mp4 looks fine"

## Post-/stop addendum — README demo GIF (commits `0ed7a1e`, `5b0b846`, `3bfa1c2`, pushed)
GitHub markdown can't inline an mp4 (shows as a link), so the README hero section now **embeds an
autoplay GIF**, with the mp4 kept as a full-quality download link. Iterated to the final form:
- v1 (`0ed7a1e`): full 49s @720px/10fps, 4.2M — banner text too small.
- v2 (`5b0b846`): 13.5s login-handoff highlight @1080px/12fps, 2.0M — banner sharp, ended on resume.
- **final (`3bfa1c2`): stitched highlight, 15s @1080px/12fps, 3.4M.** Two beats with one hard cut —
  banner→login→auto-resume, then the agent composing the ChatGPT reply in Gmail, **ending on the
  finished draft** (the payoff). `demo-hero-mfa.gif` (3.4M) + `demo-hero-mfa.mp4` (2.4M) = 6.0M media.
- GIF recipe (durable): two-pass palette — `palettegen=stats_mode=diff` then
  `paletteuse=dither=bayer:bayer_scale=3`, `fps=12,scale=1080:-1:flags=lanczos`. Stitch via
  `filter_complex` trim+concat. `*.gif` is NOT gitignored (normal `git add`); `*.mp4` is (force-added).
- Open nicety (Roi may flag): the banner→Gmail hard cut skips the ChatGPT step; could add a fade or a
  2s ChatGPT-reply beat if it reads as jarring.

## Key facts for next session
- Demo: `npm run demo:hero` (RAM burner profile `/run/user/1000/feather-demo`, wiped on reboot).
  Wipe cookies for a fresh login-on-camera: `rm -rf /run/user/$(id -u)/feather-demo` (safety hook
  blocks this from the agent — run by hand).
- Recording runbook: `scripts/demo/RECORDING.md`. Frame-extract for review:
  `ffmpeg -i v.mp4 -vf "fps=1,scale=960:-2" -q:v 4 /tmp/f_%02d.jpg`.
- Login handoff lives in `scripts/demo/continuity.ts::ensureHumanAuth` → calls
  `POST /v1/sessions/:id/await-human` (`reason`/`resumeOn`/`banner`/`timeoutMs`).
