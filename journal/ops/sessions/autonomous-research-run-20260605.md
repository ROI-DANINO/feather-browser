# Session — Autonomous Research Run (2026-06-05)

**Shape:** Roi said "go" (scratch warmed); executed `docs/plans/2026-06-05-autonomous-research-run.md`
via `superpowers:executing-plans` with parallel subagents for the research tail. Ratchet order
①→②→③→④. Roi in the loop early (one mid-run decision), then heads-down. All commits to `dev` only.

## Mid-run decision (Roi)
- **Cookie-isolation clone test: APPROVED "full clone now"** despite the shared-iPhone concern
  (scratch + primary both have passkeys on the same iPhone). I explained the risk is very low
  (Google treats accounts as separate security domains; a flag on scratch doesn't cascade to
  primary) but not provably zero, and offered a safe-subset option; Roi chose the full clone. Honored
  as his call (account owner). Still sequenced safely (measure read-only first, snapshot, throwaway
  isolated context) and never touched primary.

## What landed (all on `dev`, CI-green)

### ① ozone-platform configurable + un-gate tests — DONE
- `resolveSpawnExtraArgs()` in `src/browser/modes.ts`: env-driven `--ozone-platform` /
  `--headless=new` / `--no-sandbox` (`FEATHER_OZONE_PLATFORM`, `WAYLAND_DISPLAY`,
  `FEATHER_SPAWN_HEADLESS`, `FEATHER_SPAWN_NO_SANDBOX`). Replaced the hardcoded
  `--ozone-platform=wayland`. TDD: `tests/unit/browser/modes-ozone.test.ts` (7).
- Un-gated `attach-cdp` + `system-chromium` (dropped the `WAYLAND_DISPLAY` gates).
- **CI surfaced two real things across 3 red iterations (its job):** (a) a stale unit assertion in
  `modes.test.ts` hardcoding the wayland arg — made env-independent; (b) Chromium "exited with code
  null" under CI = no user-namespace sandbox → added `--no-sandbox` (CI-gated, off in prod, not
  JS-observable). Final CI shape: attach over CDP to `--headless=new` + `--no-sandbox`;
  `system-chromium` skipped on CI (ubuntu's `/usr/bin/chromium` is a snap that doesn't expose CDP —
  recorded finding). **CI green: 36 passed + 1 skipped.** Local Wayland: 37 passed.
- README CI/test lines updated (182 unit; CI 36+1).

### ② Live spike block on `scratch` (roionly9@gmail.com — throwaway, never primary) — DONE
- **②.1 Cookie-isolation** → `research/2026-06-05-cookie-isolation-spike-findings.md`. Measured
  scratch is **NOT DBSC device-bound** (full auth+rotation cookies, but no on-disk bound-session
  store). Cloned cookies into a fresh isolated context → **auth survived**; original session **not
  invalidated**. So copy-to-isolated is viable+safe for non-device-bound sessions. **Does NOT
  transfer to primary** (passkey-warmed, possibly DBSC) → joint call, unacted.
- **②.2 Pre-shell #6 Cookie Mine loop (ADR-0007 gate)** →
  `research/2026-06-05-cookie-mine-loop-demo.md`. Agent-style Feather session opened the
  human-warmed scratch context with **no login**, read the account email, loaded the **real Gmail
  inbox** (132 msgs), `webdriver===false`. **LOOP CLOSED → ADR-0007 gate cleared → GUI design can
  begin.**
- **②.3 Anti-detection self-test** → `research/2026-06-05-anti-detection-self-test.md`. headed-CDP
  vs `--headless=new`: headless is **trivially detectable** (UA literally `HeadlessChrome`; WebGL =
  SwiftShader software renderer; 800x600/dpr1/touch0). Headed path clean (webdriver false, plugins
  5, real GPU). **Never run the real path headless; display-less ⇒ Xvfb** (open Q: does Xvfb WebGL
  still fall back to SwiftShader — needs sudo Xvfb install, Roi-gated). Quantifies spec §6.
- Spike scripts in `scripts/spikes/` (ship nothing). Live cookies/screenshots kept in `/tmp` + local
  state debug dir, **never committed**.

### ③ Rest of the code — DONE
- **③.1** `src/browser/profile-policy.ts` `disablePasswordManager()` (merge-not-clobber) wired into
  `warm-session` before launch. TDD (2). Verified on scratch: both keys persisted through a full
  Chromium launch+finalize, profile name preserved, 42 google cookies survived. Keeps raw creds out
  of the shared jar.
- **③.2 vitest ^2 → ^4** (4.1.8). **PASS path** (not reverted): one v4 breaking change — a `vi.fn()`
  mock used with `new` must be `function`/`class` not arrow (`debug-bundle.test.ts`) — fixed. All
  suites green; **`npm audit` now 0 (full + --omit=dev)** → dev-only audit cleared.

### ④ Research tail (parallel subagents; docs committed) — DONE
- **adr-0009-shell-stack.md** (🚧 CANDIDATE): recommends **GTK4-native (Rust) + Casilda Wayland
  compositor widget + headed-Chromium two-window stopgap**; Tauri stays a genuine joint-call.
  Key finding: you can't reparent a foreign Chromium window on Wayland — the real path is a nested
  compositor, and **Casilda** (1.2.4, 2026-04) is an off-the-shelf GTK4 widget that does exactly the
  GPU zero-copy pipeline ADR-0007 thought needed building. Embeds process-boundary + language
  sub-analyses. **Open: a Casilda+Chromium latency/input spike should gate acceptance.**
- **research/2026-06-05-phase4-gui-architecture-sketch.md** (COMPLETE): SSE `/v1/events` → UI
  mapping (10 forwarded events; only `tab.updated` carries content). Found 4 real event-stream gaps
  (blank new-tab rows, no active-tab event, no mid-life session-state event, SPA stale titles) + z
  a wire double-nesting catch (`frame.data.data.url`).
- **docs/specs/2026-06-05-behavioral-fidelity-design.md** (STUBBED): signal set, opt-in
  off-by-default capture on the stealth path, credential-grade storage (backend = joint call, not
  picked), CDP replay. Harness stub proposed at `src/tools/capture-behavior.ts` (NOT written into
  src). Recording is a you-in-the-loop wall.

## Notes / process
- **`git add -A` mistake (early):** three subagent research docs rode along into ① code commits as
  passengers (43a62d6, 1ab5bf8, 77867ce) before I switched to explicit `git add <paths>`. Harmless
  (every commit green, content legit) but commit grouping is cosmetically mixed. Corrected mid-run.
- **Primary check deliberately SKIPPED.** The closeout's optional read-only primary login check was
  not run — given Roi's explicit nervousness about primary this session, I chose zero primary
  contact over the (safe, single-session) check. Left for Roi if he wants it.

## Verification (final, local)
- Unit 184/184 · integration 37/37 · measurement 4/4 · typecheck 0 · `npm audit` 0 (full+prod).
- 13 commits this run; `dev` pushed to origin each step.

## Teed up for the joint session (executor must NOT decide alone)
- **Shell-stack final pick** (GTK4-native vs Tauri) — recommendation in ADR-0009; gate on a
  Casilda+Chromium spike.
- **Cookie-isolation for the real `primary`** — measure primary's DBSC binding read-only FIRST;
  never a blind clone on the real jar.
- **Behavioral-profile / vault storage backend** — tied to frozen ADR-0008.
- **Xvfb WebGL question** — needs a sudo Xvfb install (Roi) to finish the 3-way anti-detection table.
