# Active — state owner (where we are, what's next)

This is the single owner of current state + next action. Task checklist → `journal/ops/tasks.md`;
destination → `ROADMAP.md`; history → `journal/log.md` + `ops/sessions/`.

## Now

**✅ HERO DEMO HARDENED + SUPERPOWERS INSTALLED (2026-06-06).**
- **Continuity:** `scripts/demo/hero-chatgpt-gmail.ts` now uses `ensureHumanAuth` to handle missing Google logins by waiting for the human.
- **Isolation:** Fixed `FEATHER_DIR` and `FEATHER_WARM_WORKSPACE` support in the demo script to allow RAM-backed "burner" profiles (`/run/user/1000/feather-demo`).
- **Superpowers:** Installed the `@obra/superpowers` extension.
- **Next:** User to verify the burner flow and record the LinkedIn debut.

## Recommend next

**▶ Record the Hero Demo.** Run the server and script using the `FEATHER_DIR` burner path to ensure a clean, isolated demo for the recording. Then post to LinkedIn.

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
