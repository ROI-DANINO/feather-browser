# Active - startup pointer

This file is the short live pointer for `/start`. Full phase/session map -> `ROADMAP.md` (now a thin
index) + `docs/sessions/<id>.md`; operational checklist -> `journal/ops/tasks.md`; machine pointer ->
`journal/ops/phase.md`.

## Current pointer

- **Current phase:** Phase 4a — framed for humans as **Feather v1** ("It runs errands for me").
- **v1 Instagram test — DONE (2026-06-08, this session).** Account created (`feather_test_roi`),
  Gmail confirmation retrieved from spam, social errand complete (liked @shaked_golan1's latest post +
  posted comment "Sinai looks unreal bro absolute king"). All over the local HTTP API. **v1 is proven.**
  Session closeout: `journal/ops/sessions/v1-instagram-test-complete-20260608-0345.md`.
  Blog entry: `blog/0013-the-test-that-passed.md`.
- **NEXT = Session 4a.8 — Markdown snapshot extraction.** Port Crawl4AI's DefaultMarkdownGenerator
  to TypeScript natively. First v1 "Port". Session spec: `docs/sessions/4a.8-markdown-snapshot.md`.
- **Deferred fixes (not blocking 4a.8):**
  - Resume-confirmation linger ~1s (`src/browser/pause-banner.ts`)
  - Disposable headed-CDP `ENOTEMPTY` cleanup race
  - No `selectOption` command
  - `extract` empty-body on multi-match selector
  These can be a single short pass before or after 4a.8.

## Key facts for next session

- **Scratch profile** (`workspaceId: scratch`) has `feather_test_roi` IG account + warmed
  `roionly9@gmail.com` Google session. Handle carefully — this is the test identity.
- **Server lifecycle:** kill by pid from `endpoint.json`; read baseUrl with
  `grep -o '"baseUrl": *"[^"]*"'`; start from a shell with `WAYLAND_DISPLAY`/`DISPLAY` for headed windows.
- **IG input quirk:** confirmation code input ignores `fill` + `type` modes. Use Shift+Tab +
  individual `press` keypresses. Filed under things to watch for.
- **Spam first** for email confirmation codes — learned this session; saved to memory.
- **Tab API:** `POST /tabs` creates blank page; must follow with explicit `/navigate`.
- `continuity.test.ts` is a pre-existing flake — ignore it.

## Recent completed context

- **v1 Instagram test DONE (2026-06-08):** full signup + email verify + social errand. PASS.
- **Pause-for-human primitive DONE (2026-06-08, `dev` 5d7a9b8):** `await-human` + on-page Resume
  banner (DOM-flag/CDP-poll). Live-tested with Roi. Specs `docs/specs/2026-06-08-pause-for-human-*`.
  Finding: banner dies on page navigation → v2 MFA Handler must re-inject on `framenavigated`.
- **v1→v2→v3 restructure + open-source doctrine (2026-06-08):** `feather.md`,
  `docs/roadmap/{v1,v2,v3}.md`, `adr-0011`; ROADMAP is now the execution engine-room index.
- **4a.9 DONE:** hero demo recorded (28s, 1.25x), in README, pushed.
