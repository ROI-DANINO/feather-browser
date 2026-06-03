---
title: Write It Down, Or It Didn't Happen
date: 2026-06-03
entry: 0002
milestone: "S1 Foundation complete — stabilization program, ADR-0004/0005, spikes"
maps_to: [adr-0004-runtime-target, adr-0005-agentic-north-star, docs/plans/2026-06-03-s1-foundation.md]
tags: [decisions, adr, stabilization, ai-collaboration, foundation]
status: published
---

# Write It Down, Or It Didn't Happen

There's something that happens when you build with AI that I didn't expect: **decisions don't stick.**

Not because the AI is bad at its job. Because every session starts from zero. There's no continuity of memory — I open a new conversation, and my collaborator has no idea what we decided three sessions ago. The judgment calls we made, the options we considered and rejected, the constraints that shaped the whole direction — gone. Which means if I don't write it down formally, every decision is provisional. Every conversation is a re-litigation.

Phase 3 ended in a good place: merged to master, 129 tests green, a live event stream that a future UI can subscribe to. Phase 4 was calling — the visual shell, the actual browser window, the thing that starts to look like what I described to friends. I could feel the pull.

I stopped.

## The stabilization program

Instead of charging at Phase 4, I ran a three-session maintenance pass I'm calling S1 — Foundation. Eleven tasks across three sessions: reconcile the docs to match reality, lock the decisions into formal records, and probe two open questions I'd been carrying around.

The reasoning was simple: Phase 4 is going to be the hardest and most exciting thing we've built. I want to walk into it knowing exactly what I decided and why, with the ground solid under my feet. A week of foundation work now is worth more than a month of confusion later.

It's the least glamorous work in the project. It's also, I think, the most important.

## The decisions

The centerpiece of S1 was writing two ADRs — Architecture Decision Records. Boring name, important thing.

**ADR-0004** locked the runtime target. Feather runs on the host system — no container, no VM, just Linux. The packaging path is Flatpak, eventually, for sandboxing at distribution time. And Electron is still dead. (I know I keep saying this. I keep saying it because the temptation keeps coming back. A bundled Chromium for the UI plus Playwright's Chromium for the browsing is two Chromiums, and two Chromiums is the opposite of feather. The answer is no. It's written down now.)

**ADR-0005** is the one I'm more proud of. It's the agentic North Star — the first formal statement of what "AI-native" actually means as a design constraint for Feather, not just a vision statement. The answer we landed on: **token and context efficiency are a standing design constraint, starting now.** Not later, when the agent layer arrives. Now, in every choice we make about how the system is structured. Minimize the tokens an agent needs to understand state. Minimize the context window required to act. And — importantly — we're not picking *which* AI tools to integrate yet. The MCP spec isn't final until July 28. We'll make that call in Phase 5, once the ground has stopped moving.

Here's the thing about ADRs in an AI-assisted project: they're not documentation. They're memory. The reasoning, the options considered, the constraint that tipped the balance — all of it is in the file. When I start a new session, I load it. When the AI makes a decision that conflicts with a prior one, I can catch it. The file is more reliable than any conversation I've had.

Write it down, or it didn't happen.

## What we looked for, and didn't find

S1 also ran two research spikes — two questions I needed real answers to before moving forward.

The first: does our SSE plugin work with Fastify v5? (We need to upgrade Fastify for security reasons.) The answer: probably, but nobody's tested it. The dependency says it supports v5 in theory; in practice it was only ever tested against v4. This is something S3 has to prove, not assume.

The second: can Playwright drive the system Chromium on Fedora, so we can drop the bundled 300MB Chromium download? The answer: I don't know, because Chromium isn't installed on this machine yet. That's not a failure — it's an accurate map. S2 needs to install it and actually run the test.

Both spikes came back inconclusive. That's fine. I'd rather know where the unknowns are than pretend they don't exist.

---

Next up: S2 — actually install system Chromium and run the test, add the `TAB_UPDATED` event, verify the tracing story. The unglamorous work continues.

Then Phase 4.

---

## 🔗 LinkedIn cut

I build with AI. Every session starts from zero — my collaborator has no memory of what we decided before.

So I've had to learn something: **write it down, or it didn't happen.**

This week I ran a three-session maintenance pass on Feather before moving to the next big phase:
→ Reconciled all the docs to match reality
→ Wrote two formal decision records (ADRs) — one on runtime architecture, one on what "AI-native" actually means as a design constraint
→ Ran two research spikes, both came back inconclusive (which is useful — now I know where the unknowns are)

The ADRs are the part I'm most proud of. Not because they're interesting to read, but because they're the mechanism that keeps a project coherent when your "team" has no persistent memory. Future me and future AI both read the same file.

The least glamorous week of the project so far. Probably the most important.

#BuildInPublic #Linux #AI #BrowserDev #FoundationWork
