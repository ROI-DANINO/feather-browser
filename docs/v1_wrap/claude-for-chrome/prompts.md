# Feather v1 Showcase — Claude-for-Chrome prompt set

Companion to the Feather agent-driven run in `../test_1/`. **Same 10 errands, same discipline**, but
phrased for **Claude for Chrome** (which already controls a real Chrome) instead of the Feather HTTP
API. Paste **each block into its own fresh Claude-for-Chrome session** and save the reply, so the
outputs line up against `../test_1/tasks/*.md` for an apples-to-apples capability comparison
(agent + Feather  vs  agent + Claude-for-Chrome).

## How to use

1. Each prompt below is **self-contained** — paste one into a new session, run it, save the output.
2. Suggested logging: drop each reply in `outputs/<TASK>.md` next to this file (e.g. `outputs/E1.md`),
   so the tree mirrors `../test_1/tasks/`.
3. Keep the same report shape (VERDICT / RESULT / EVIDENCE / LESSON) — it's baked into every prompt.

## Login / environment notes (read before running the Hard tier)

- **E1, E2, E3, M1, M2, M3, H4** need no login — run in any Chrome.
- **H1** needs a Chrome **logged into the Google account** you want the calendar event created on.
- **H2** works logged-out, but a logged-in Google reduces consent/bot friction.
- **H3** ⚠️ needs a Chrome **logged into Instagram**, and it takes **REAL public actions** (a real like
  and a real public comment on a stranger's post) on whatever account is logged in. In the Feather run
  this was the throwaway `feather_test_roi` account — use a test account, not a personal one, unless
  you mean it.

## What differs from the Feather run (for your analysis)

- Feather agents drove a **headed Chromium via the Feather API** (observe/act-by-ref/re-observe) on
  isolated profiles (disposable for E/M/H4, warmed `scratch` for H1/H2/H3).
- Claude for Chrome drives **your actual Chrome** with whatever extensions/login/state it has.
- So differences in outcome may come from the harness, the profile warmth, or the browser state — note
  which when you compare.

---

## EASY TIER

### E1 — Hacker News top story

```
You are testing your own ability to complete a real web errand in the browser, end to end, using the
Chrome you control. You get ONLY the errand below — no hints, no answer key. Figure out the rest
yourself. Optimize for TRUTH, not a green checkmark: if you cannot complete it, a clean PARTIAL/FAIL
with the reason and what you learned is a SUCCESS — never fake or assume success; verify what actually
happened on the page.

ERRAND: Go to Hacker News (news.ycombinator.com). Find the current #1 (top) story. Report its exact
title and how many points it currently has.

When done, report back exactly these lines:
- VERDICT: PASS / PARTIAL / FAIL
- RESULT: the answer (title + point count)
- EVIDENCE: how you verified it from the page
- LESSON: what broke / what you'd do differently / "clean run"
```

### E2 — Tel Aviv weather

```
You are testing your own ability to complete a real web errand in the browser, end to end, using the
Chrome you control. You get ONLY the errand below — no hints, no answer key. Figure out the rest
yourself. Optimize for TRUTH, not a green checkmark: if you cannot complete it, a clean PARTIAL/FAIL
with the reason and what you learned is a SUCCESS — never fake or assume success; verify what actually
happened on the page.

ERRAND: Find the current weather in Tel Aviv, Israel right now. Report the temperature and the
conditions.

When done, report back exactly these lines:
- VERDICT: PASS / PARTIAL / FAIL
- RESULT: the temperature + conditions
- EVIDENCE: how you verified it from the page
- LESSON: what broke / what you'd do differently / "clean run"
```

### E3 — microsoft/playwright GitHub stars

```
You are testing your own ability to complete a real web errand in the browser, end to end, using the
Chrome you control. You get ONLY the errand below — no hints, no answer key. Figure out the rest
yourself. Optimize for TRUTH, not a green checkmark: if you cannot complete it, a clean PARTIAL/FAIL
with the reason and what you learned is a SUCCESS — never fake or assume success; verify what actually
happened on the page.

ERRAND: Find out how many stars the GitHub repository microsoft/playwright currently has. Report the
star count — the exact number, not just the rounded header display.

When done, report back exactly these lines:
- VERDICT: PASS / PARTIAL / FAIL
- RESULT: the star count
- EVIDENCE: how you verified it from the page
- LESSON: what broke / what you'd do differently / "clean run"
```

---

## MEDIUM TIER

### M1 — Web search "Feather Browser"

```
You are testing your own ability to complete a real web errand in the browser, end to end, using the
Chrome you control. You get ONLY the errand below — no hints, no answer key. Figure out the rest
yourself. Optimize for TRUTH, not a green checkmark: if you cannot complete it, a clean PARTIAL/FAIL
with the reason and what you learned is a SUCCESS — never fake or assume success; verify what actually
happened on the page.

ERRAND: Search the web for "Feather Browser". Tell me the title of the top result and what it is
about.

When done, report back exactly these lines:
- VERDICT: PASS / PARTIAL / FAIL
- RESULT: top result title + what it's about (or the wall you hit, if any)
- EVIDENCE: how you verified it from the page; which search engine you used
- LESSON: what broke / what you'd do differently / "clean run"
```

### M2 — httpbin form fill + submit

```
You are testing your own ability to complete a real web errand in the browser, end to end, using the
Chrome you control. You get ONLY the errand below — no hints, no answer key. Figure out the rest
yourself. Optimize for TRUTH, not a green checkmark: if you cannot complete it, a clean PARTIAL/FAIL
with the reason and what you learned is a SUCCESS — never fake or assume success; verify what actually
happened on the page.

ERRAND: Go to https://httpbin.org/forms/post. Fill in the customer name field with "Feather Tester"
and submit the order. Confirm the submission actually went through (the resulting page should echo
back your submitted data).

When done, report back exactly these lines:
- VERDICT: PASS / PARTIAL / FAIL
- RESULT: what you submitted and what the result page echoed back
- EVIDENCE: how you verified the echo from the page
- LESSON: what broke / what you'd do differently / "clean run"
```

### M3 — Mount Everest elevation (Wikipedia)

```
You are testing your own ability to complete a real web errand in the browser, end to end, using the
Chrome you control. You get ONLY the errand below — no hints, no answer key. Figure out the rest
yourself. Optimize for TRUTH, not a green checkmark: if you cannot complete it, a clean PARTIAL/FAIL
with the reason and what you learned is a SUCCESS — never fake or assume success; verify what actually
happened on the page.

ERRAND: Find the elevation (height above sea level) of Mount Everest using Wikipedia. Report the
figure in meters and feet. Be careful to report the ELEVATION specifically — not prominence,
isolation, or any other number on the page.

When done, report back exactly these lines:
- VERDICT: PASS / PARTIAL / FAIL
- RESULT: the elevation figure
- EVIDENCE: how you verified it is the elevation from the page
- LESSON: what broke / what you'd do differently / "clean run"
```

---

## HARD TIER

### H4 — Multi-tab research: 3 facts

```
You are testing your own ability to complete a real web errand in the browser, end to end, using the
Chrome you control. You get ONLY the errand below — no hints, no answer key. Figure out the rest
yourself. Optimize for TRUTH, not a green checkmark: report each fact's status individually; if one of
the three fails, that is an honest PARTIAL (e.g. 2/3) — never fake or assume success; verify each fact
from its page.

ERRAND: Using multiple browser tabs, gather these three facts and report all three:
(1) the exact title of the current top story on Hacker News (news.ycombinator.com),
(2) the current temperature in Tel Aviv,
(3) the current exact star count of the GitHub repo microsoft/playwright.

When done, report back exactly these lines:
- VERDICT: PASS / PARTIAL / FAIL  (PASS only if all 3/3 verified)
- RESULT: the three facts (HN title | Tel Aviv temp | playwright stars)
- EVIDENCE: how you verified each from its tab; how many of 3 succeeded
- LESSON: what broke / what you'd do differently / "clean run"
```

### H1 — Next Israeli holiday → all-day Google Calendar event

> Run in a Chrome logged into the Google account you want the event on. Creates a REAL calendar event.

```
You are testing your own ability to complete a real web errand in the browser, end to end, using the
Chrome you control (which is logged into Google). You get ONLY the errand below — no hints, no answer
key. Figure out the rest yourself. Optimize for TRUTH, not a green checkmark: if a step fails, a clean
PARTIAL/FAIL with the reason and the lesson is a SUCCESS — never fake or assume success; don't assume
the Save click worked, re-check the calendar.

ERRAND: Find the NEXT upcoming Israeli public holiday — the first one whose date is after today. Then
create an all-day event for it in Google Calendar on that holiday's actual date, with the event title
containing the holiday's name. Finally, verify the event was actually saved on the correct date by
looking at the calendar. Create exactly ONE event — do not make duplicates (if the holiday is already
on the calendar, note it but still complete your own create + verify cleanly).

When done, report back exactly these lines:
- VERDICT: PASS / PARTIAL / FAIL
- RESULT: which holiday, what date, and the event you created
- EVIDENCE: the source you researched the holiday from + how you verified the event appears on the calendar on that date
- LESSON: what broke / what you'd do differently / "clean run"
```

### H2 — Google search → top article → extract

```
You are testing your own ability to complete a real web errand in the browser, end to end, using the
Chrome you control. You get ONLY the errand below — no hints, no answer key. Figure out the rest
yourself. Optimize for TRUTH, not a green checkmark: if you hit a bot wall or the content won't
extract, a clean PARTIAL with the reason is a SUCCESS — never fake or assume success; ground your
summary in the actual article text, not memory.

ERRAND: Search Google for "history of the internet". Open the top organic result article (a real
article — not an ad, not the AI overview box). Then read and extract the article's main content, and
report a short summary of what it actually says.

When done, report back exactly these lines:
- VERDICT: PASS / PARTIAL / FAIL
- RESULT: which article (title + URL) and a 2-3 sentence summary grounded in its text
- EVIDENCE: how you got there (search → which result) and that the summary came from the page content
- LESSON: what broke / what you'd do differently / "clean run"
```

### H3 — Instagram: pick a real post, like + comment, verify

> ⚠️ Run in a Chrome logged into a **test** Instagram account. This takes REAL PUBLIC ACTIONS — a real
> like and a real public comment on a stranger's post. Do not run on a personal account unless you
> mean it.

```
You are testing your own ability to complete a real web errand in the browser, end to end, using the
Chrome you control (which is logged into Instagram). You get ONLY the errand below — no hints, no
answer key. Figure out the rest yourself. This takes REAL PUBLIC ACTIONS on a real account — keep the
comment kind, genuine, and appropriate. Optimize for TRUTH, not a green checkmark: never fake or
assume a like/comment landed — re-check the page and confirm. If the post is a video with no readable
image, or comments are sparse, say so — a comment grounded in fewer sources, or a clean PARTIAL
explaining what you couldn't verify, is an honest SUCCESS.

ERRAND: On Instagram, look at the home feed and pick ONE real, NON-SPONSORED post (not an ad/
"Sponsored", and don't just blindly act on whatever is literally first). Then:
  1. LIKE that post (the post's main like control — not a comment's like button).
  2. Write and post a thoughtful, genuine COMMENT on it, based on the post's actual content: what's in
     the image/photo, what the caption says, and what the top commenters are saying. Make it specific
     to THIS post, not generic.
Finally, VERIFY both: that your like registered (the like control flipped to the liked / "Unlike"
state) and that your comment is actually visible on the post.

When done, report back exactly these lines:
- VERDICT: PASS / PARTIAL / FAIL
- RESULT: which post (author/URL if available), the exact comment you posted, and whether you liked it
- EVIDENCE: how you confirmed the like flipped AND the comment is visible; which content sources (image/caption/comments) you grounded the comment in
- LESSON: what broke / what you'd do differently / "clean run"
```
