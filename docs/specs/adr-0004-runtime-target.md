# ADR-0004 — Runtime Target: Host-Primary, Flatpak Distribution, Podman Optional

- **Date:** 2026-06-03
- **Status:** Accepted
- **Context phase:** Stabilization & Linux-Readiness program, S1

## Context

Feather is Linux-only (Fedora target). Until now, "where does Feather run" was an
undocumented assumption: all prior research silently assumed a host process
(system Chromium via RPM Fusion, libsecret, XDG portals, Wayland sockets, D-Bus).
The option of running Feather inside a Podman container was raised and needs an
explicit decision, because it changes how Chromium, Wayland, GPU, and credentials
are reached.

Feather's endgame is a GUI daily-driver browser (Phase 4 shell + Wayland + GPU +
audio). GUI apps in containers fight Wayland/GPU/audio passthrough. The
desktop-native sandbox for a GUI app is Flatpak (uses XDG portals), which the
research already recommends for distribution. Podman's strengths (reproducible
isolation, Fedora-native, rootless) apply best to the headless service / CI /
future agent-runtime side, not the daily-driver path.

## Decision

1. **Host-primary.** The daily-driver runs as a host process. This is the primary
   supported runtime.
2. **Flatpak** is the eventual distribution/sandbox format (planned in/around
   Phase 4), using XDG portals for file/credential/screen access.
3. **Podman** is an *optional* target for the headless service and CI only — not
   the primary runtime, not the daily-driver path.
4. **Decision-independent code.** Anything that references the browser binary must
   be configurable (e.g. `FEATHER_CHROMIUM_PATH`) so it works whether Chromium is
   host-installed (RPM Fusion) or baked into a container image. No hardcoded host
   paths.

## Consequences

- Phase 4's Wayland/GPU/GUI path stays simple (no container passthrough).
- The S2 `executablePath` work serves host and container equally.
- Flatpak packaging and portal integration become explicit Phase 4/5 concerns.
- If a future need makes a containerized daily-driver compelling, this ADR must be
  revisited; it is not a permanent ban on Podman, only a primary-path decision.
