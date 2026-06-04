# Research: Linux/Fedora Tools & Advantages
# Date: 2026-06-02 | Source: Web research pass

## Context

Feather Browser is Linux-only. These are native Linux tools that directly benefit the
project. Organized by phase where they apply.

---

## Phase 4 Relevant

### System Chromium (RPM Fusion) — HIGH PRIORITY
Playwright can use system Chromium instead of downloading its own:
```ts
chromium.launch({ executablePath: '/usr/bin/chromium' })
```
On Fedora: install `chromium` from RPM Fusion.
Impact: eliminates ~300MB Playwright Chromium download from the install footprint.
CRITICAL for "Feather" branding. MUST test in Phase 4 Step 0.
Risk: version mismatch between system Chromium and Playwright internals. Test carefully.

Also useful: `PLAYWRIGHT_CHROMIUM_SKIP_DOWNLOAD=1` env var to prevent auto-download.

### Wayland
Fedora defaults to Wayland (GNOME on Wayland since Fedora 25, now fully mature).
Playwright / Chromium Wayland flag: `--ozone-platform=wayland`
Without it, Chromium runs via XWayland (works but adds overhead).
Decision: require Wayland-native Chromium in Phase 4 or allow XWayland fallback?

### D-Bus (vs SSE for shell events)
We built SSE (`GET /v1/events`) for the shell to consume browser lifecycle events.
D-Bus is the Linux-native alternative:
- Binary protocol, lower latency than HTTP SSE
- Native pub/sub via D-Bus signals (matches our event model exactly)
- systemd-integrated, introspectable
- Downside: requires a D-Bus service definition, more complex setup
- Our SSE endpoint ALREADY WORKS — switching is only worth it if performance is a proven issue
Recommendation: keep SSE for Phase 4, note D-Bus as Phase 5+ optimization if needed.

### inotify (Linux file system events)
Our ProfileLock does a pid-check for stale locks (process.kill(pid, 0)). This is reactive.
inotify could watch the lock file directory and proactively detect stale locks faster.
Also useful for watching profile directories for unexpected changes.
Node.js wrapper: `@parcel/watcher` or `chokidar` (uses inotify on Linux).
Low priority — current stale lock recovery works correctly.

### GTK4 + libadwaita
If Architecture C (native GTK shell) is chosen for Phase 4:
- GTK4 is Wayland-first, very lightweight
- libadwaita: GNOME HIG-compliant widgets, matches Fedora/GNOME look
- node-gtk: Node.js GTK bindings (keeps TypeScript stack)
- Rust + GTK4: gtk-rs (if Tauri Rust backend is used)
Available as Fedora packages: `gtk4-devel`, `libadwaita-devel`

---

## Phase 5+ Relevant

### libsecret / GNOME Keyring
Credential vault for Phase 5+ is already solved on Fedora.
- `libsecret` stores/retrieves passwords via the Secret Service D-Bus API
- GNOME Keyring (or KWallet) implements the backend
- Fedora package: `libsecret` (already installed on GNOME Fedora)
- Node.js binding: `keytar` (uses libsecret on Linux)
- DO NOT build a custom credentials vault — use libsecret

### XDG Desktop Portals
Required if Feather is distributed via Flatpak (sandboxed).
Handles: file dialogs, screen sharing, camera, notifications, secrets — all with user consent.
- `org.freedesktop.portal.FileChooser` — native file open/save dialogs
- `org.freedesktop.portal.Secret` — forwards to libsecret/GNOME Keyring
- `org.freedesktop.portal.ScreenCast` — screen sharing via PipeWire
Works across GNOME, KDE, and other DEs on Fedora.
Portal daemon: `xdg-desktop-portal` + `xdg-desktop-portal-gnome`

### GStreamer + PipeWire (Media)
For Phase 5+ yt-dlp / media features:
- GStreamer: the correct media pipeline on Linux (not raw subprocess)
- PipeWire: replaced PulseAudio as default audio/video on Fedora 34+
- gst-plugins-bad: includes webrtcbin (needed for Tauri WebRTC if chosen)
- yt-dlp can output to GStreamer pipeline: `yt-dlp -o - URL | gst-launch-1.0 fdsrc ...`
- Don't build a raw ffmpeg/subprocess adapter — use GStreamer as the boundary

### Flatpak (Distribution)
Correct distribution format for Linux desktop apps on Fedora.
- Handles sandboxing, auto-updates, portal access
- Available on Flathub (large user base)
- Requires portal support for file/credential access
- Flatpak manifest defines permissions: `--filesystem`, `--socket=wayland`, etc.
- Plan this in Phase 4 or Phase 5, not after — retrofitting sandbox breaks things

### SELinux (Fedora Default Security)
Fedora uses SELinux (enforcing by default, unlike Ubuntu which uses AppArmor).
Chromium on Fedora gets an automatic SELinux profile.
If Feather launches Chromium, SELinux may block some system calls in strict environments.
Don't fight SELinux — run `audit2allow` if issues arise, contribute a proper policy.
This is mostly a Phase 5+ concern for production hardening.

### procfs (/proc)
Already using this: our ProfileLock stale pid check uses `process.kill(pid, 0)`.
This is Linux-specific (works because `/proc/<pid>` exists). Already correct.

---

## Sources
- https://packages.fedoraproject.org/pkgs/libsecret/libsecret/
- https://wiki.archlinux.org/title/XDG_Desktop_Portal
- https://wiki.gnome.org/Projects/Libsecret
- https://gist.github.com/DreamShaded/764ae360fd7dd74d1f12d23f6581b6d1 (system Chromium on Linux)
- https://playwright.dev/docs/browsers
- https://linuxiac.com/fedora-in-2025-ai-integration-wayland-advancements-hdr-and-more/
