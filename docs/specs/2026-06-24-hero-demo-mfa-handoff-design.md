# Hero Demo v2 — Visible Human Handoff on the Google Login Leg

> **Status:** design, approved 2026-06-24. Phase 3 ("Show it off — a NEW, stronger demo") of the
> reorientation plan of record (`docs/specs/2026-06-24-reorientation-and-roadmap-restructure.md`).
> Change classification: **UI readiness / showcase** — reuses shipped features, no new modules.

## Goal

Upgrade the existing hero demo so it **visibly shows Feather's human-handoff mechanism** during the
Google login leg, instead of waiting silently in the console. The errand itself (ChatGPT "hello world"
→ draft the reply in Gmail) is unchanged. This is the "It runs errands for me" thesis with the
Cookie-Mine trust handoff made visible on screen.

## Background — what the current demo does

- `npm run demo:hero` → `scripts/demo/run-hero-demo.sh` → `scripts/demo/hero-chatgpt-gmail.ts`.
- Login is handled by `ensureHumanAuth` in `scripts/demo/continuity.ts`: it navigates to Gmail,
  probes for the compose button, and if absent **polls the console** until login completes. Feather's
  role is invisible — the viewer sees only Google's own login UI.
- ChatGPT is used **anonymously** (no login). Gmail is logged in by the **human**. Neither leg is
  agent-driven, so the MFA subsystem (`mfa/challenge`, typed-code inject) never fires and is **out of
  scope** here — it is built for agent-driven logins, which this demo does not have.

## The feature we surface (already shipped)

`POST /v1/sessions/:sessionId/await-human` (`src/commands/await-human.ts`, `AwaitHumanSchema` in
`src/transport/routes.ts`). Input:

```ts
{
  reason: string,
  resumeOn?: { target: Target; until: "visible" | "hidden" | "attached" | "detached" },
  banner?: boolean,      // default true — on-page Resume banner
  timeoutMs?: number,    // default 300000
}
```

Behavior (`AwaitHumanHandler`): injects the blue on-page Resume banner (`src/browser/pause-banner.ts`,
`showBanner`), **re-injects it on every `domcontentloaded`** so it survives navigations, and races three
resolvers — human clicks Resume (DOM flag polled over CDP), the `resumeOn` signal appears, or timeout.
Returns `resumedBy: "human" | "signal" | "timeout"`. The Resume button sets a DOM flag only (no network,
no token on the page).

This is a strict superset of what the demo's console poll does, **plus** the on-screen banner.

## Design — the change

Single file: `scripts/demo/continuity.ts`. `ensureHumanAuth` keeps its signature and its
already-authenticated fast path; only the "not logged in" branch changes.

```
ensureHumanAuth(api, sessionId, { targetUrl, checkTargets }):
  navigate(targetUrl)                              # Gmail; Google redirects to login if needed
  if probeTargets(checkTargets, 3000): return      # warmed profile → skip login (re-run stays clean)

  # Not logged in → real handoff (replaces the console polling loop)
  await api.POST(`/v1/sessions/${sessionId}/await-human`, {
    reason: "Log into Google here — finish any 2-step / 2FA — then I'll continue (or click Resume)",
    resumeOn: { target: checkTargets[0], until: "visible" },   # auto-resume the instant the inbox loads
    banner: true,
    timeoutMs: 300000,
  })

  # Post-check: a premature Resume click resolves the handoff before login is done.
  if not probeTargets(checkTargets, 5000):
    throw "Resumed but Google is not authenticated yet — log in fully, then re-run."
```

Notes:
- `resumeOn` uses `checkTargets[0]` = `div[role='button'][gh='cm']` (the language-independent Gmail
  compose button), so login success auto-resumes regardless of UI language. The post-check `probeTargets`
  still tries all candidates (English/Hebrew).
- The Resume button is a **manual backup**; in the normal path `resumeOn` fires first and the human never
  needs to click it.
- The config fields `pollIntervalMs` / `timeoutMs` on `ContinuityConfig` collapse to the single
  `await-human` timeout. Keep `timeoutMs` (passed through); drop the now-unused `pollIntervalMs` plumbing
  if it has no other caller (verify before deleting).

## Flow on camera

1. Headed window opens on Gmail → Google redirects to the login page.
2. **Feather's blue Resume banner appears at the top** — the visible mechanism.
3. Human logs in. **If Google challenges 2FA, the human completes it there, behind the banner.** The
   banner shows every run; the 2FA step shows only when Google decides to challenge ("usually, not
   always").
4. Inbox loads → `resumeOn` fires → agent resumes automatically.
5. Agent runs the unchanged errand: ChatGPT "hello world" → settle the reply → draft it in Gmail →
   stop, draft **unsent**, session closed cleanly.

## The one real risk → verification gate (first task in the plan)

The banner must **survive Google's full login redirect chain** (Gmail → `accounts.google.com` → back to
inbox). The re-inject-on-`domcontentloaded` hook is built for exactly this but has **never been tested
against Google's real flow**; `accounts.google.com` may carry a CSP that interferes (note: the banner is
built via `page.evaluate` DOM calls + programmatic `.style`, not a `<script>`/`<style>` tag, so script-src
CSP should not block it — but this is unproven and must be checked live).

**Gate:** before recording, run a throwaway live test on the `scratch` profile (sacrificial identity,
never `primary`). Assert: banner appears on the login page → survives the redirects → resumes (via
`resumeOn` and via a manual Resume click). Outcomes:
- **Survives** → proceed to record.
- **Does not survive** → small fix (e.g. confirm the `domcontentloaded` re-inject fires cross-origin), or
  fall back to `banner: false` (off-page/console resume) and record the passive version. An honest
  PARTIAL with the recorded lesson is an acceptable result (testing-honesty rule).

## Deliverables

1. `scripts/demo/continuity.ts` — the handoff swap above.
2. Operate-by-hand **recording runbook** (short): `wf-recorder` capture, `scratch` profile, the human
   steps, start/stop. Lives with the demo (e.g. `scripts/demo/RECORDING.md` or a section in the existing
   demo notes — pick the existing home if one exists).
3. The recorded hero video committed or linked, and the README "Hero Demo" section updated to point at it
   (replacing or augmenting `demo-final.mp4`).
4. **Separate checklist item** (`journal/ops/tasks.md` Phase 3): one-sentence binary "done" line per
   version row in `feather.md`. Not part of this spec's code change; tracked alongside.

## Out of scope

- The `mfa/challenge` typed-code inject path (agent-driven; no agent login here).
- Agent mouse-motion / visible cursor — deferred to **v3** (real synthesis is parked 5d.4 work; faking a
  cursor for the video would be a rigged demo).
- Any change to the ChatGPT→Gmail errand logic.

## Testing

- The live banner-survival gate above (the real proof).
- `continuity.ts` has existing tests if any (`grep` before editing); keep `ensureHumanAuth`'s
  already-authenticated fast path covered. No new framework — match what's there.
