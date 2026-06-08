---
name: feather-data-extraction
description: Use when reading or scraping content from a web page through Feather Browser — pulling text, links, structured fields, or a list of items. Covers snapshot (cleaned markdown) for reading, and extract recipes for structured/repeating data, plus the first-match limit. Triggers on "scrape", "extract data", "read the page", "get the content", "pull the list", "grab the links", "what does this page say", "collect the items".
---

# Feather: Data Extraction

Builds on **using-feather-browser**. Two tools, two jobs: **snapshot** to *read* a page, **extract**
to pull *structured* fields.

## Reading a page → snapshot

For "what's on this page" / "summarize this" / "get the text or links":
```http
POST /v1/sessions/:sessionId/snapshot   {}
```
Returns:
- `markdown` — cleaned page content (nav/header/footer/ads/scripts stripped), capped at 20k chars.
  **This is your primary read** — it's the human-readable content, not raw HTML.
- `text` — plain text (also capped; tune with `limits.textChars`).
- `links` — `[{ text, href }]` (tune with `limits.links`).
- `title`, `url`, `meta.description`.

```http
POST /v1/sessions/:sessionId/snapshot   { "limits": { "textChars": 50000, "links": 500 } }
```
(`markdown`'s 20k cap is fixed and not request-configurable.)

## Pulling structured fields → extract

For named fields off the page:
```http
POST /v1/sessions/:sessionId/extract
{ "recipe": { "fields": {
    "title": { "selector": "h1", "type": "text" },
    "price": { "selector": ".price", "type": "text" },
    "image": { "selector": "img.hero", "type": "attribute", "attribute": "src" }
} } }
```
- `type: "text"` grabs the element's text; `type: "attribute"` grabs the named `attribute`.
- **Each field selector resolves to its FIRST match.** This is intentional (no strict-mode crash on
  multiple matches) — but it means you can't collect a whole list with one top-level selector.

## Collecting a list / repeating rows

Because each field is first-match, scope to a row. Two approaches:

1. **Scope selectors to a container** so each call targets one row, iterating containers by index via
   the page, or
2. **Snapshot's `markdown`/`links`** — for simple lists (article links, nav items), the `links`
   array or the markdown's bullet lists are often all you need, no recipe required.

For genuinely repeating structured rows, snapshot first to understand the row markup, then extract
per-row with scoped selectors.

## Choosing the right tool

| Goal | Tool |
|------|------|
| "Read / summarize this page" | `snapshot` → `markdown` |
| "Get all the links" | `snapshot` → `links` |
| "Get these specific named fields" | `extract` with a recipe |
| "Get a list of items" | `snapshot` (markdown/links) first; `extract` per-row if structured |

## Gotchas

- **extract is first-match only** — don't expect arrays from one selector; scope per row.
- **markdown is capped at 20k** — for very long pages, target the section you need or use `extract`.
- **Snapshot after navigation/interaction** — stale reads come from reading before the page settled;
  pair with `wait { until: "stable" }` if content loads async.
