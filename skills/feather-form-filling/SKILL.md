---
name: feather-form-filling
description: Use when filling out a web form through Feather Browser — signup, login, checkout, multi-field input, dropdowns, date pickers, or any "enter these values and submit" task. Covers observe-first field finding, fill vs sequential typing, native vs custom dropdowns, and submit-then-verify. Triggers on "fill out the form", "sign up", "register an account", "log in", "enter my details", "complete the checkout", "select from the dropdown".
---

# Feather: Form Filling

Builds on **using-feather-browser**. Forms are where element discovery used to bite hardest —
`observe` solves it: fields come back as named refs even on bare markup (no ARIA, no placeholder —
the `name` attribute fallback still names them). Observe first, fill by ref.

## The form loop

1. **Observe** the page. Find each field in `actions` by `role`/`name` (e.g.
   `{ role: "textbox", name: "Email" }`) and note its `ref`.
2. **Fill one field by ref, move on.** Don't batch-assume — a wrong target fails loudly per field.
   Typing does **not** expire refs; you can fill several fields from one observe.
3. **Don't expect typed text in the diff.** The observe diff is structural — typed values produce an
   empty diff. Verify via the submit outcome (or a `wait`), not the diff.
4. **Submit, then verify** the expected next state (or an error message). A submit usually
   navigates: `navigated: true` in the click response is a hint — re-observe and confirm the landed
   page.

## Filling text fields

```http
POST /v1/sessions/:sessionId/type
{ "target": { "by": "ref", "ref": "obs_a1b2.e0" }, "text": "user@example.com" }
```

- **`mode: "fill"`** (default) — sets the value instantly. Use for normal fields.
- **`mode: "sequential"`** with optional `delayMs` — types key-by-key. **Use when the field
  validates on keystroke** (username-availability checks, masked/formatted inputs, autocomplete that
  must fire). Example: a username field that shows green/red as you type.

```http
{ "target": {...}, "text": "feather_test_roi", "mode": "sequential", "delayMs": 40 }
```

## Dropdowns — know which kind you have

The observe entry tells you: `tag: "SELECT"` → native; `role: "combobox"`/`"listbox"` on a DIV →
custom widget.

**Native `<select>`** → use `select-option`:
```http
POST /v1/sessions/:sessionId/select-option
{ "target": { "by": "ref", "ref": "obs_a1b2.e4" }, "values": "US" }
```
`values` is a string or array (multi-select). Returns `selected` — but if `navigated: true` is also
present (`onchange` redirect), `selected` is unverified; re-observe and confirm.

**Custom widget** is **not** a `<select>` — `select-option` won't work. Drive it like a human:
click the trigger by ref, re-observe (the open menu's options are new elements — check
`diff.added`), click the option by its fresh ref. If the menu doesn't appear in the observe, it may
have fallen past the cap — re-observe with a higher `cap`.

## Submit and verify

```http
POST /v1/sessions/:sessionId/click
{ "target": { "by": "ref", "ref": "obs_a1b2.e7" } }

POST /v1/sessions/:sessionId/wait
{ "target": { "by": "text", "text": "Verify your email" }, "until": "visible" }
```
Always verify — a 200 on the click only means the click happened, not that the form was accepted.
Wait for the success state **or** for a validation error so you can react. If the click returned
`navigated: true`, re-observe: all old refs are dead, and the landed page tells you whether the
submit was accepted.

## Gotchas

- **Refs expire on navigation and on every new observe** (`REF_EXPIRED`) — re-observe, re-target.
  Mid-form re-observes are cheap; stale-ref guessing is not.
- **Keystroke validation** silently fails with `mode: "fill"`. Switch to `sequential`.
- **Stubborn custom inputs** (per-digit confirmation-code fields, heavy React widgets) can ignore
  `fill` *and* `sequential`. Fallback that works: move focus onto the field (click or Shift+Tab),
  then send one `press` per character.
- **A consent overlay over the form** → `dismiss` first; act from the returned `observation` refs.
- **A login/CAPTCHA mid-form** → hand off via **feather-human-handoff** (note its navigation limit).
