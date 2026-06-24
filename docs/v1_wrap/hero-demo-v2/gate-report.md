# Hero Demo v2 — Banner-Survival Live Gate Report

> Gate from `docs/plans/2026-06-24-hero-demo-mfa-handoff.md` Task 2. The one real unknown:
> does Feather's on-page Resume banner **survive Google's login redirect chain**, and does the
> handoff auto-resume on login? Run operate-by-hand on the burner demo profile with a throwaway
> Google account (never `primary`). 2026-06-24.

## Verdict: **PASS (narrowed)**

The banner appeared on the Google login page, survived the email→password navigation, and the
handoff auto-resumed the instant the inbox loaded. The full errand then ran unassisted.
**Not exercised:** no 2-step/2FA challenge fired (same-machine login → Google didn't challenge),
so banner survival across a *2FA challenge page* specifically is still unproven.

## Evidence

### Run 1 — verification (session `ses_78b9561e4b`), session-log timeline

```
02:06:56  navigate → accounts.google.com/v3/signin/identifier   (Gmail bounced to login)
02:06:59–07:05  3× wait (3s)  = "already authenticated?" probe → failed → handoff starts (banner injected)
02:07:14  → accounts.google.com/v3/signin/challenge/pwd          (human entering password)
02:07:22  → mail.google.com/mail/u/0/                            (logged in — inbox loaded)
02:07:23  await-human RETURNS                                    (resumeOn signal: compose visible)
02:07:24  navigate → chatgpt.com → type/click → back to Gmail → compose/draft  ✅
```

The handoff spanned the whole login (identifier → password → inbox) and returned via the
`resumeOn` signal — the human did **not** need to click Resume. No 2FA step appeared in the chain.

### Run 2 — recording (session `ses_ed45fe57d4`), visual confirmation

Frame review of the recorded take (`demo-hero-mfa.mp4`) confirms the banner was **visible and
legible** — "⏸ Feather paused: Log into Google here — finish any 2-step / 2FA — then I'll continue
(or click Resume)" with the Resume ▸ button — on:
- the **email** entry page (`accounts.google.com/v3/signin/identifier`), and
- the **password** page (`accounts.google.com/v3/signin/challenge/pwd`).

i.e. it **re-injected across the cross-page navigation** (the `domcontentloaded` hook working as
designed). The console then printed `[Continuity] ✓ Authenticated. Resuming demo.` and the agent
continued: ChatGPT "Hello, world! 👋" → Gmail draft → "Draft is ready and has NOT been sent."

## Residual / what to test next

- **2FA-page survival** is unproven (no challenge fired same-machine). The real-account run Roi
  flagged for later — which is expected to trigger phone-tap verification — is the natural test of
  banner survival across a challenge page. Phone-tap resolves via the same `resumeOn` (inbox visible)
  path, so it should work; confirm when run.
- Re-record-only polish gaps are tracked in `scripts/demo/RECORDING.md` (opaque terminal, calmer
  background, full terminal on screen).
