# Session — The Door I Didn't Build (5c design pass → reframed)

- **Stop:** 2026-06-23 03:46 UTC
- **Phase:** 4a / v2 security spine
- **Bundle:** this /stop consumes **3 pending `/next` entries** (5a Identity, v2-wrap scope, 5b MFA)
  + this session (5c design pass). The 3 prior entries are folded in below as prior-chat context.

## Headline

The 5c design pass **reframed the v2 wrap and produced zero code by design.** Conclusion: the spine's
**safety is delivered by Feather's native, credential-safe API** (Safe tier) + the 5b MFA brake —
**not** by handing out raw CDP. Raw-CDP attach is **interop, not safety → deferred to 5e.** The safety
spine is **build-complete on paper; only the live test remains.**

## Done this session (5c pass)

- Ran the 5c design pass as a brainstorm with Roi (house/keys/lockbox/welded-door analogies). Surfaced
  the two-dangers model (portable key-theft vs bounded in-session abuse) and the outsider/public-repo
  threat (attacker has the blueprints; the real risk is phishing past the human gate).
- Designed the "welded door" filtering proxy in full (block `Network`/`Storage` → HttpOnly crown-jewel
  cookies always safe; allow `Runtime.evaluate` → tools work; origin-pin; single-connection; one-time
  door token; `cdp-attach` hold owns the socket; auto-kill-on-MFA) — then **shelved it** when Roi asked
  "should we build a native tool instead?"
- Traced the wrap exit criterion against shipped reality → **already met** by 5a + native API + 5b MFA
  pause/`HUMAN_IN_CONTROL` brake. No spine build work remains.
- **Decision doc written:** `docs/specs/2026-06-23-5c-native-vs-cdp-attach-decision.md` (the reframe,
  the exit-criterion trace, the preserved proxy design, honest caveats). Self-reviewed, no placeholders.
- **Reconciled pointers:** `ROADMAP.md` (5c → 5e/interop-deferred; build-order + spine notes),
  `journal/ops/tasks.md` (top block + v2 wrap-scope note), `journal/context/active.md` (new NOW entry).
- **Memory:** added `feather-security-first-framing` (frame security tradeoffs outsider-threat-first,
  honest residuals, plain analogies; he decides) + index line.
- **Blog:** wrote `blog/0021-the-door-i-didnt-build.md` (folded in the owed banner/human-in-control beat
  as "the brake I forgot I had"); cleared `_pending.md`; updated the index table.

## Prior-chat context folded in (the 3 consumed /next entries)

- **5a Identity Model SHIPPED + committed** (`3674d82` feat + `6a72bc0` chore, TDD). Named handle over a
  warmed profile; `src/identity/{types,store,manager}` + `identity-routes` + `http-helpers`; 6 routes;
  `LaunchSessionInput.identityId` resolver seam; council S1–S5 baked in. Gates: tsc clean, 399u,
  identity 4i, full integration 96/96 (lone red = pre-existing niri attach-cdp viewport). Also cleared
  v1 leftovers (run_h3 removed; dup Rosh Hashana events deleted; H3 viewport → niri tiling-WM finding).
- **v2-wrap docs landed + spine scope decided** (`d6cbf46` merged to dev + pushed). Scope (now updated
  by today's reframe): originally "5b MFA → 5c attach"; Stealth 5d + LinkedIn deferred to v2.5. Scope
  doc `docs/specs/2026-06-23-v2-spine-completion-plan.md`.
- **5b MFA Handler SHIPPED** (`12ffa91`, TDD, pushed). Reconciled onto Gate A (reuse primitives, keep
  MFA distinct): `src/mfa/*` + `src/commands/mfa-challenge.ts` + 4 routes + 3 `mfa.challenge.*` SSE
  events. mfa hold + banner-free pause replace the dead `setStealthMode`; 256-bit humanToken off the
  agent URL; CSRF/CSP/origin anti-phishing; session-close cancels. Gates: tsc clean, 435u, mfa 5i, full
  integration 101p/1skip/1 pre-existing niri red. Also: v2.5 testing-grounds docs (`928cdbb`/`e6030a5`).
  **⚠️ Proven with a MOCK browser only.**

## Left unfinished

- **Live testing brainstorm** — the spine is build-complete *on paper*; 5b never met a live MFA wall.
  This is the next session and the only thing between "I think it's done" and "done."
- Today's tracking-file edits committed at this /stop (decision doc, ROADMAP, tasks, active, blog, memory).
- Still deferred (unchanged): 5d Stealth + LinkedIn exit test → v2.5; IG credential rotation under 5d.

## Next concrete action

- **The deferred testing brainstorm:** drive a warmed identity through a real login/MFA challenge,
  human-in-loop, brakes observed (Roi drives the human steps). No spine build work remains. A clean
  failure-with-lesson there is a *passing* test (testing-honesty rule).

## Decisions

- **Native path IS the v2 spine's safety**; raw-CDP attach = interop → **deferred to 5e**, built only on
  real external-tool demand. Welded-proxy design **preserved (shelved, not lost)**; Gate A's
  `cdp-attach` door stays **built-but-dormant**.

## Ideas

- If raw-CDP attach is ever built: **pipe-based CDP** (`--remote-debugging-pipe`) = no open debug port
  to scan at all (closes the "raw port already exists" residual).

## Roi quotes (verbatim)

- "why does A sounds like a security hazard?"
- "i dont want to over complicate stuff but security is first priority"
- "i think a dangare can come from others as well... someone who gets how feather works can use it
  maliciusely against other feather users (me) and thats what i want to address."
- "should we build a native tool instead of Playwright, browser-use etc?... am i overthinking it?"
- *(chose)* "Native is the spine; defer raw-CDP attach (recommended)"

## Gates / state

- No code changed this session → no test run needed. Last green gates (from 5b, `12ffa91`): tsc clean,
  435u, mfa 5i, full integration 101p/1skip/1 pre-existing niri red.
- No running dev server.
