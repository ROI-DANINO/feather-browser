# Session — Skills Rewrite + Semantic Asserts + Iframe-Overlay Dismiss Fix

**Date:** 2026-06-10 (~12:43 stop)
**Phase:** 4a — Feather v1 ("It runs errands for me")
**Branch:** `dev` (3 commits pushed: `91fcd2b`, `553216a`, `6263bd6`)
**Bridge consumed:** none — `journal/context/next.md` was an empty buffer (reset at the 12:03 stop).

## What happened

The session closed all three remaining v1 follow-ups from the observe-bug-fixes stop, the third
pulled forward mid-`/stop` by Roi ("i think i want to tackel it first :/").

### 1. Operator-skills rewrite to the observe loop (`91fcd2b`)

All 4 `skills/` files (`using-feather-browser`, `feather-form-filling`, `feather-data-extraction`,
`feather-human-handoff`) rewritten from snapshot-first to **`observe → act by ref → re-observe
(diff)`**: ref-first targeting table (`obs_<id>.eN`, `REF_EXPIRED` semantics), the verified
`/dismiss` shape (`overlaysRemaining` = ground truth, act from `observation` refs), `navigated:
true` recovery, typed wall-detection signal (blocking overlay + `occludedBy` + overlay-owned
actionables) in human-handoff. Also: AGENTS.md "rewrite queued" caveat retired; api-reference
bare-`eN` ref drift fixed. Verification = claim-by-claim check against the code-verified
playbook/api-reference (the pass-2 run was the RED baseline); caught + fixed one own over-claim
(pre-pause refs only `REF_EXPIRED` if the human's action navigated). `.claude/skills` symlinks pick
the rewrite up with no re-registration.

### 2. Suite semantic-assertion layer (`553216a`)

PASS in `examples/showcase.sh` now means the errand was done right (H1 already had its semantic
rewrite at 12:03; this completed the layer):

- **H3:** like verified via the **"Unlike" state flip**; comment **content-aware** — caption parsed
  from snapshot text (`author / stats / author / caption / more`) — and verified visible as the
  full `Love this — <snippet>` string (snippet alone aliases the caption). Generic fallback or any
  unverified leg → PARTIAL with the precise reason.
- **M3:** asserts the target fact (`8,848.x` elevation) per the spec's own criterion — non-empty
  infobox cell was below spec.
- **H4:** per-fact semantic checks (title, temperature pattern, star count numeric after `k`/`m`).
- **E1:** title AND point count.

**Verified live** (started the dev server, ran each changed task, stopped the server cleanly):
E1 PASS (725 points), M3 PASS (8,848.86 m), H4 PASS (3/3), H3 **first ran honest PARTIAL** (both
CSS caption probes empty) → screenshot + live probe showed why (first post was a video; first
`span[dir=auto]` is the username, first `img` the avatar, no `h1` in feed) → snapshot-text parse →
PASS, screenshot-verified ("Love this — fate - awesome edit by 🙌" derived from the post's real
caption, heart red). H1 deliberately NOT re-run (would create a duplicate real calendar event for
no new information). Spec revision log updated.

### 3. Same-origin iframe-overlay dismiss gap — FIXED (`6263bd6`)

Pulled forward from the review follow-up during the stop flow. Root cause was narrower than
documented: `walkAllFrames` already collected same-origin iframe-inner buttons but **deleted their
`overlayIndex`** (child indices would dangle), and an iframe-inner button is `actionable` in its
own frame — so `pickDismissTargets`' overlay gate never matched: observe saw the button, dismiss
could never pick it. Fix = the recorded idea: top-frame walk now returns its overlay **element
handles**; each same-origin child frame's `frameElement` is matched against them (composed-tree
containment, handle identity in one top-frame evaluate); the child's actions **inherit** that
overlay's index; deeper frames inherit downward. TDD: red integration test first on a **real
local-HTTP fixture** — an iframe from a `data:` URL is opaque-origin, the same vacuity trap the
12:03 reviewers caught — failed exactly on `overlayIndex: undefined`, green after the fix.
Docs (playbook, api-reference `overlayIndex` row, 2 skills) now draw the precise line:
**same-origin iframe overlays dismissable; cross-origin (third-party CAPTCHA frames) =
`await-human` by design** (cross-origin descent is the v1 deferral, not a dismiss bug).

## Gates

typecheck clean · **280/280 unit** · **73/73 integration** (72 + new iframe test) · all 4 changed
showcase tasks verified live · no leaked sessions, dev server stopped by pid.

## Decisions

- Skills verification = evidence-grounded claim-by-claim check vs playbook/api-reference (pass-2
  evidence as baseline), not spawned pressure-test agents.
- H3 content-aware = snapshot-text caption parse (CSS proven dead live); visibility assert on the
  full comment string to avoid caption aliasing.
- Don't re-run unchanged H1 (real-world side effect, no information gain).
- Cross-origin iframe overlays stay `await-human` — documented as the line, not queued as a gap.
- Blog: declined → owed line in `blog/_pending.md` (3 owed now).

## Left open (recorded in tasks.md)

- **NEXT = v2 Gate A** (Session 5.0.0, ADR-0010) — phase boundary: planning/reconciliation pass
  first, fresh session.
- (kind,name) overlay-identity mutation watch-item (code change only on real-world failure).
- Navigation-survivable resume banner (v2 MFA core).
- C4C transcripts analysis (optional research; inbox keep).
- H3 cosmetic: 5-word caption snippet can dangle mid-phrase; identical comment text could alias the
  visibility grep on a repeat post.

## Lessons

- The honest PARTIAL was the engine of the session: H3's first failing run forced the live markup
  probe that produced the durable "parse the snapshot text, not IG's CSS" recipe.
- Documented limitation ≠ measured limitation: the "iframe overlay gap" was recorded as broad;
  reading the walker shrank it to one deletable line + a missing containment check.
- `data:`-URL iframes are opaque-origin — any same-origin iframe test must ride real http://
  fixtures (second time this trap appears; now pinned in two test files).

## Roi quotes

- "Ready to continue"
- "Continue into the semantic assertions"
- "good and noblog"
- "i think i want to tackel it first :/" *(the iframe gap, mid-stop)*
- "yes resume the stop"
