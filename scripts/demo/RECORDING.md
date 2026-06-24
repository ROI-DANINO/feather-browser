# Recording the hero demo

Operate-by-hand. Uses [`wf-recorder`](https://github.com/ammen99/wf-recorder) (Wayland) +
`slurp` for region select, and `ffmpeg` for the trim/compress pass. Roi drives the human login.

The committed `demo-hero-mfa.mp4` was produced this way: ~49s, 1280px wide, ~2.4M.

## 1. Clean slate (login-on-camera take)

Wipe the RAM-backed burner profile so the next run prompts a fresh login:

```bash
rm -rf /run/user/$(id -u)/feather-demo
```

(Skip this to record the *warmed* re-run, which has no login step — useful for a shorter cut.)

## 2. Record

Start the recorder on the browser+terminal region, then run the demo in another terminal:

```bash
wf-recorder -g "$(slurp)" -f demo-hero-raw.mp4     # drag-select the region
# in another terminal:
npm run demo:hero
```

- When the blue **Feather paused** banner appears, log in with the **throwaway** Google account
  (finish any 2-step / 2FA yourself). The agent auto-resumes once the inbox loads — or click **Resume ▸**.
- Let the agent finish: ChatGPT reply → Gmail draft (unsent). At the `Record the visible draft now…`
  pause, let the draft sit on screen a couple of seconds.
- Stop the recorder (`Ctrl-C`), then press Enter in the demo terminal to close the session cleanly.

## 3. Trim + compress

`wf-recorder` writes a fat, near-4K file. Trim the messy head (prior-run console) and tail (the
recorder's own output), downscale to 1280px, and re-encode quality-locked (CRF — keeps screen text
crisp; do NOT force a hard size cap, which softens text):

```bash
# find clean cut points first by eyeballing frames if needed:
#   ffmpeg -i demo-hero-raw.mp4 -vf "fps=1,scale=960:-2" -q:v 4 /tmp/f_%02d.jpg
ffmpeg -y -ss <START> -to <END> -i demo-hero-raw.mp4 \
  -vf "scale=1280:-2" -c:v libx264 -crf 23 -preset slow -pix_fmt yuv420p -an \
  -movflags +faststart demo-hero-mfa.mp4
```

Cut to start when the browser opens and end on the Gmail draft (the payoff).

## 4. Publish

`*.mp4` is gitignored; the hero video is force-added:

```bash
git add -f demo-hero-mfa.mp4
```

> **Public-repo note:** record the *published* video with the throwaway account, never your real
> Google — the repo is public and the video shows the inbox + email address. Testing with a real
> account locally (e.g. to exercise phone-tap verification) is fine; just don't commit that take.

## Known polish gaps (re-record only)

The committed take is functional but not pixel-perfect. For a launch-grade cut: use an **opaque
terminal** over a **calm/solid background** (the current one shows wallpaper bleed), keep the full
terminal on screen (text is clipped at the left edge), and start the recorder *after* any prior run
has finished. The Chrome-for-Testing automation infobar is honest (it *is* automation) — leave it.
