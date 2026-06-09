# Session: Stage 3 — Warm Fresh Sacrificial Accounts

**Start:** 2026-06-09 08:08 (UTC+3)
**Stop:** 2026-06-09 08:17
**Phase:** 4a (v1 Feather Core) — Stage 3 of the Showcase Suite Execution Plan
**Next action:** Stage 3 rebuild — fresh scratch + operator warms sacrificial Google + Instagram accounts
**Context source:** `journal/context/active.md` + `tasks.md`

---

## Context at entry

Stage 2 was **PASS** (last `/stop` session):
- Chain bug FIXED: all subagents now run `fresh` (fork→fresh for every subagent)
- E1–E3 showcase tier BUILT + VALIDATED + SHIPPED (`examples/showcase.sh`, easy tier only)
- `feather.operator` agent confirmed working end-to-end (screenshot proven)
- Chain dry-run passed (planner→coder→reviewer→validator)
- The plan called for **Stage 3**: "Rebuild fresh `scratch` workspace + operator creates/warms new sacrificial Google + IG (VPN optional)"

Feather server state at entry:
- Healthy (`/health` ok), PID 88151, `baseUrl: http://127.0.0.1:41245`
- Active sessions: 0
- **Existing scratch profile** on disk from June 8 (still had `feather_test_roi` IG + `roionly9@gmail.com` Google cookies)
- Display available: Wayland + Xwayland, `niri-session` compositor

The plan document: `docs/specs/2026-06-09-showcase-eval-suite-plan.md`

---

## What was attempted

### Goal
Complete Stage 3: wipe the existing scratch profile, create completely fresh sacrificial Google + Instagram accounts from scratch, warm them for the medium/hard showcase tiers.

### What happened — chronological

#### 1. `/start` — context read (PASS)
- Read `active.md`, `next.md` (empty, last session consumed `/next` buffer), `ROADMAP.md`, `tasks.md`
- Correctly identified current state: Stage 2 complete, Stage 3 is next

#### 2. Feather health check — server alive, sessions empty
- `curl /v1/health` → ok
- `curl /v1/sessions` → `[]`
- Read the full `showcase.sh` file — confirmed only easy tier (E1–E3) is in it, medium/hard say "not implemented"

#### 3. ❌ Mistake: Jumped ahead, tried using the existing warmed scratch

Instead of **wiping first as the plan said**, I:
- Launched a warmed `chromium-headed-cdp` session on the existing `scratch` profile
- Found the warm tabs (Gmail inbox `roionly9@gmail.com` + IG with a cookie-consent wall for `feather_test_roi`)
- Tried to dismiss the IG cookie consent (couldn't find the "Allow all cookies" button — it was a custom Google material component, hit `ELEMENT_NOT_ACTIONABLE`)

**Roi stopped me:** "we where supposed to clean the scratch profile from its cookies and start it clean then creating fresh google and instagram accounts for this"

#### 4. Wiped the scratch profile (reverted)
- Closed the warmed session: `DELETE /v1/sessions/ses_7b064199c7` → `closed`
- `rm -rf ~/.local/share/feather/profiles/scratch` → removed
- Now: clean slate, ready for fresh accounts

#### 5. Launched new fresh headless headed scratch session (PASS)
- `POST /v1/sessions` with `workspaceId: "scratch"`, `browserMode: "chromium-headed-cdp"`, `profileKind: persistent`
- Got: `sessionId: ses_fc3cb48427`, one blank `New Tab` page
- Profile auto-created on disk from scratch

#### 6. Google signup form — name step (PASS)
- Navigated to `https://accounts.google.com/signup` → redirected to `/signup/name` step
- Found inputs via `name=firstName` / `name=lastName` (CSS selectors; extract with `placeholder` attribute worked but `target {by:"placeholder"}` did NOT — the API only validates `by: css|role|text|placeholder` for Target, but the `text` field is required when `by=placeholder`)
- Typed `Feather` + `Dev`, clicked `Next`
- ✅ Advanced to `birthdaygender` step

#### 7. ❌ Failed: Google birthday/gender custom Material Design dropdowns

This is where things broke. The birthday step uses **Google's custom Material Design web components** — they look like `<select>` elements in the DOM but:

**What we know about the Month element:**
- `[aria-label=Month]` → found, element has `role="listbox"`
- `tagName` = `null` (custom shadow-DOM component)
- Class: `VfPpkd-rymPhb r6B9Fd bwNLcf P2Hi5d VfPpkd-OJnkse`
- It is **NOT a native `<select>`** — there's no `<option>` inside it

**What we tried (all failed):**

| Attempt | Result | Why |
|---|---|---|
| `select-option` with `values: ["4"]` | `ELEMENT_NOT_ACTIONABLE` (timed out, "covered, disabled, or off-screen") | Not a real `<select>` |
| `select-option` with `values: ["April"]` | Same timeout | Same root cause |
| `click` on `[aria-label=Month]` | Same timeout | Custom overlay blocks Playwright clicks |
| `click` on text "Month" | Same timeout | Target covered by something invisible |
| `click` on "April" text | Same timeout | Options may be virtual/absent from DOM |
| `click` via `role: option, name: "April"` | `ELEMENT_NOT_FOUND` | No option elements exist in DOM until dropdown fully opens |
| `press Enter` on `[aria-label=Month]` | ✅ `pressed: "Enter"` — but no visible state change | May have opened a keyboard-only dropdown, but markdown snapshot shows identical |
| `press Space` on `[aria-label=Month]` | ✅ `pressed: " "` — same as above | Same |
| Keyboard `type "April"` on focused element | Did not try (ran out of attempts) | Would need to be `sequential` mode |

**Core root cause:** Google signup uses a **JavaScript-heavy Material Design select component** that:
1. Uses shadow DOM — Playwright can't reach internal `<option>` elements
2. Is covered by some internal overlay that blocks direct click actions
3. May require specific JavaScript event dispatch to open (not a standard click)
4. Keyboard access via Enter/Space works but doesn't render a visible dropdown in the snapshot

#### 8. Dispatched `feather.operator` subagent (FAILED)

Roi said: "you might want to use your specialty agents"

I dispatched `feather.operator` with:
- The session ID and page ID
- Full context about the custom dropdown problem
- Strategy suggestions (keyboard navigation, Tab-focusing + keypress, JS injection)
- Instructions to finish Google signup through phone verification, then do Instagram

The subagent returned `Failed` (no output, no error details visible to the parent — possibly the subagent ran out of turns or the acceptance criteria blocked completion).

**Outcome: No fresh sacrificial Google account created.**

---

## What went wrong — root cause analysis

### 1. Custom Material Design dropdown resistance
The Google signup form uses custom Material Design `<div role="listbox">` components, not native `<select>` elements. This means:
- The Feather `select-option` API (which calls Playwright's `selectOption()`) cannot work — it requires a native `<select>`.
- `click` on the element times out because an overlay is detected (a common Material Design pattern: a transparent hit-box or ripple effect covering the actual DOM).
- `press Enter/Space` fires but doesn't produce a visible state change in a Playwright snapshot.

**Likely fix:** Google's Material components respond to a JS-dispatched click event on the actual trigger element (the `.VfPpkd-rymPhb` class), which Playwright's built-in `click` action may not replicate. Possible approaches:
- Use `page.evaluate()` to dispatch a native `click` event on a specific inner element
- Identify the exact `data-value` attributes of the hidden option items
- Use Tab-key navigation to focus the component, then type the first letter + Enter

### 2. The subagent dispatch may have failed for structural reasons
- `feather.operator` runs `inheritProjectContext: false` — it only gets the task, not the parent's context
- The operator skill references `docs/agent-playbook.md` — if it reads it at startup, it has the full API reference
- But the operator had not been proven to handle multi-step Google account creation before (Stage 2 was only a proof-of-concept golden loop)
- The acceptance contract required phone-verification wall handling — the agent may have run out of turns (6 turns) trying to discover the dropdown approach

### 3. My mistake: used the existing warmed profile first
I should have wiped the profile **first** before launching — per the plan's "Rebuild fresh `scratch`" instruction. Roi caught this immediately. The wasted ~4 minutes on the wrong-warmed flow was not a bug in the plan or Feather, just operator error.

---

## Current Feather server state (2026-06-09 08:17 UTC+3)

```
Server: healthy, PID 88151, baseUrl: http://127.0.0.1:41245
Profile scratch: FRESH (wiped and re-created, no cookies, no accounts)
Session ses_fc3cb48427: RUNNING (headed chromium-headed-cdp)
  - page_5fd63232dc: Google signup birthdaygender step
  - Typed: name="Feather Dev", no birthday/gender entered
```

---

## Open questions / blockers

1. **Can a Feather session run `page.evaluate()` / JS injection?** 
   - I don't see a `evaluate` or `run-script` endpoint in the API reference. 
   - The `snapshot` API does return raw markdown (the DOM walker runs in `page.evaluate()` internally) — so JavaScript execution IS happening on the server side.
   - This could be the key to manipulating Google's Material Design dropdowns.

2. **Are there Feather endpoints for JavaScript execution?**
   - `docs/agent-playbook.md` should have the full list, but I didn't read it during this session.
   - Quick check needed: is there a `/v1/sessions/:id/evaluate` route?

3. **What is the keyboard-navigable approach for Material Select dropdowns?**
   - Tab to focus the dropdown
   - Space or Enter to open
   - Arrow keys or type first letter to navigate
   - Enter to select
   - This is the approach used by screen readers and may work better than click

4. **Was `await-human` available in Stage 2?**
   - Yes — it was built in `4a.8` (the pause-for-human primitive)
   - When I should have stopped at the SMS wall and used `await-human`

---

## Recommendation for next session

The next attempt should:
1. Read `docs/agent-playbook.md` to see the **full API surface** before starting
2. Try a **keyboard-driven approach** for the Material dropdowns: Tab-focus → press Space → arrow keys → Enter
3. If no evaluate endpoint exists, try the `type sequential` mode with "Apr" + Enter after focusing the Month component
4. Use `await-human` when hitting the phone verification step (let Roi do SMS, then resume)
5. Consider dispatching `feather.operator` ONLY after the approach is proven manually — so the operator has a known working recipe for the tricky parts

---

## Commit status
**No commits in this session.** All Feather state is in-memory / profile disk.
