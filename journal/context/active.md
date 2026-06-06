# Active — state owner (where we are, what's next)

This is the single owner of current state + next action. Task checklist → `journal/ops/tasks.md`;
destination → `ROADMAP.md`; history → `journal/log.md` + `ops/sessions/`.

## Now

**✅ BURNER DEMO FULLY WORKING (2026-06-06, `a2e9ec9`).**
- `npm run demo:hero` — single command; starts RAM-backed server, runs hero script, tears down on exit.
- Gating: Recording requires a screen recorder. Environment is **Niri/Wayland**. Recommended **Kooha** or **wf-recorder**.

## Recommend next

**▶ Record the Hero Demo.** Once a screen recorder is installed, run `npm run demo:hero`, screen-capture the live run, post to LinkedIn.

---

**(History — superseded by the demo hardening above.)**
**✅ HERO DEMO BUILT + VERIFIED WORKING LIVE (2026-06-06 18:33, `d1b5718`).** Roi: *"it works."* The
ChatGPT→Gmail cross-site script is real: `scripts/demo/hero-chatgpt-gmail.ts` drives the warmed
`primary` profile **headed** through ChatGPT (type `hello world` → send → `wait until:"stable"` on the
**last** answer → read the reply) → Gmail (compose a **draft** to Anthropic with that reply, **stops
before send**). Resilient fallback selectors (EN+HE Gmail labels), no screenshots/cookies in the repo,
browser kept open on failure. ChatGPT is warmed into `primary` (now holds Google/Gmail + ChatGPT in one
jar). Spec/plan `docs/specs|plans/2026-06-06-hero-demo-workflow*.md`. Gates: **212 unit (incl. 5 new
demo-helper tests) + `tsc --noEmit` 0**; committed + pushed (`origin/dev` in sync). ▶ **NEXT = the only
step left: record the live run (screen-capture while it drives the window) → final README touch-ups →
LinkedIn debut.** (Minor: recipient defaults to `support@anthropic.com`, overridable via `HERO_DEMO_TO`.)
Verified + journal-reconciled this session: `ops/sessions/hero-demo-verified-20260606-1854.md`.

...
