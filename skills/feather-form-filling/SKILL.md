---
name: feather-form-filling
description: Use when filling out a web form through Feather Browser — signup, login, checkout, multi-field input, dropdowns, date pickers, or any "enter these values and submit" task. Covers discover-first field finding, fill vs sequential typing, native vs custom dropdowns, and submit-then-verify. Triggers on "fill out the form", "sign up", "register an account", "log in", "enter my details", "complete the checkout", "select from the dropdown".
---

# Feather: Form Filling

Builds on **using-feather-browser**. Forms are where element-discovery friction bites hardest (real
sites often lack `name`/`placeholder`/labels). Discover first, then fill deliberately.

## The form loop

1. **Snapshot** the page. Read `markdown` to confirm which form/fields are present.
2. **Find each field** with the most stable target available (preference order from the entry skill).
   If a field has no semantic handle, probe with `extract` for its attributes before falling back to
   `{"by":"css","selector":"input","at":N}`.
3. **Fill one field, move on.** Don't batch-assume — a wrong selector fails loudly per field.
4. **Submit, then verify** the expected next state (or an error message) with `wait`.

## Filling text fields

```http
POST /v1/sessions/:sessionId/type
{ "target": { "by": "placeholder", "text": "Email" }, "text": "user@example.com" }
```

- **`mode: "fill"`** (default) — sets the value instantly. Use for normal fields.
- **`mode: "sequential"`** with optional `delayMs` — types key-by-key. **Use when the field
  validates on keystroke** (username-availability checks, masked/formatted inputs, autocomplete that
  must fire). Example: a username field that shows green/red as you type.

```http
{ "target": {...}, "text": "feather_test_roi", "mode": "sequential", "delayMs": 40 }
```

## Dropdowns — know which kind you have

**Native `<select>`** → use `select-option`:
```http
POST /v1/sessions/:sessionId/select-option
{ "target": { "by": "css", "selector": "#country" }, "values": "US" }
```
`values` is a string or array (multi-select). Returns `selected`.

**Custom widget** (`role="combobox"`, `role="listbox"`, styled `<div>` menus — common on modern
sites) is **not** a `<select>`. `select-option` won't work. Drive it like a human:
```http
POST /v1/sessions/:sessionId/click   { "target": {"by":"role","role":"combobox","name":"Month"} }
POST /v1/sessions/:sessionId/click   { "target": {"by":"role","role":"option","name":"January"} }
```
When unsure which kind it is, snapshot/extract the element's tag and role first.

## Submit and verify

```http
POST /v1/sessions/:sessionId/click
{ "target": { "by": "role", "role": "button", "name": "Sign up" } }

POST /v1/sessions/:sessionId/wait
{ "target": { "by": "text", "text": "Verify your email" }, "until": "visible" }
```
Always verify — a 200 on the click only means the click happened, not that the form was accepted.
Wait for the success state **or** for a validation error so you can react.

## Gotchas

- **No stable selectors?** That's the norm on big sites. Snapshot → `extract` attributes to learn
  the markup → only then use index targeting. Re-snapshot after any field reveals new fields.
- **Keystroke validation** silently fails with `mode: "fill"`. Switch to `sequential`.
- **A submit that navigates** ends your in-page handles — snapshot the new page before continuing.
- **A login/CAPTCHA mid-form** → hand off via **feather-human-handoff** (note its navigation limit).
