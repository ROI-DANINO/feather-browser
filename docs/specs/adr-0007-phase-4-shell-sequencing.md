# ADR-0007 — Phase 4 Shell: Sequencing & Display Model (Stopgap First, Seamless Shell Deferred)

- **Date:** 2026-06-04
- **Status:** Accepted
- **Context phase:** ROADMAP Phase 4 Step 0 (Visual Desktop Shell — research + plan)

## Context

Phase 4 Step 0 asked how to wrap the headless core in a visual desktop shell. Two
empirical spikes on the target machine (Fedora, Wayland, `niri` tiling compositor,
Playwright 1.60 bundled Chromium) settled the gating unknowns:

1. **Chromium runs headed natively on Wayland** — confirmed with `--ozone-platform=wayland`
   and `DISPLAY` unset (no XWayland fallback). No X11 crutch required.
2. **The "Wayland can't embed a foreign window" blocker is not fatal** — under a tiling
   compositor the OS arranges separate top-level windows; the app cannot self-size/place
   (niri overrode requested geometry). More importantly, a **headless + painted-in** model
   has no window to embed at all, dissolving the problem.
3. **Feather's control model works on a visible browser** — a persistent context, with an
   "agent" tab opened via `context.newPage()` (== `SessionManager.openTab`), inherits the
   human's session cookies. The Cookie Mine (ADR-0003) foundation holds with a real engine.

Two display models emerged:

- **Real-window:** Chromium shows its own window; Feather controls sit in a separate,
  compositor-tiled window. Near-zero effort, zero lag, two-window UX.
- **Painted-in:** Chromium runs headless; Feather is one app window showing a live
  screencast of the page with input forwarded back. Seamless "it's my browser" UX, but
  costs latency/CPU and a real capture→encode→transport→paint→input pipeline. Latency is
  dominated by rendering/transport architecture (GPU frame sharing, HW video encode), not
  by implementation language — a dedicated research-and-build effort in its own right.

## Decision

1. **Target end-state is the painted-in, one-window seamless shell.** This matches the
   product vision ("feels like one browser") and the lightweight direction
   ([[project_lightweight_engine_direction]]): one shared Chromium, a thin shell, no
   second engine. **Only the *display model* (painted-in) is the direction — the
   *implementation stack* (rendering, transport, and UI layer; e.g. Rust, Zig, GTK,
   Tauri, or something else) is explicitly NOT decided. It is active R&D toward a
   high-quality, featherweight result.** Do not read this ADR as committing to any
   particular toolkit or language.
2. **Defer building the seamless shell** to its own future, dedicated phase that opens with
   real R&D — research + tests to decide and architect the low-latency rendering/transport
   stack (a low-level, high-performance effort; specific tech is open, not chosen). It is
   polish over a product thesis not yet proven end-to-end, and the most expensive,
   least-differentiating piece at this stage.
3. **Use headed Chromium as the stopgap human surface** until the seamless shell is built.
   It is real, fast, and trusted, and lets all agent-layer work proceed on top of it.
4. **Tackle next, before the shell:** prove the **full Cookie Mine loop end-to-end and
   visible** (human logs into a real site; an agent tab acts on that same authenticated
   session without re-logging-in), then harden the runtime/control around it.

## Consequences

- Phase 4 is reframed: the immediate goal is a working, controllable, persistent human
  session + the end-to-end agent-piggyback demo — **not** a polished GUI shell.
- The seamless low-latency shell becomes a later dedicated phase (display pipeline +
  Rust/Zig latency research). Re-evaluate once the thesis is validated.
- `niri`-tiling vs. stock GNOME (floating) window behavior is a product-scope question
  parked for the shell phase; the stopgap and the painted-in end-state both sidestep it.
- No toolkit/`sudo` installs are needed for the next step; the shell-R&D phase will introduce
  whatever stack the research selects (likely a Roi-run sudo step).
