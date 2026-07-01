# Gym — Behavioral Diagnostic Results

Honest record. UNSCORED is a FAIL when the detector is UP (unscoreable is a tell), but BLOCKED
when the detector's backend is DOWN (it can't grade anyone).

> **Verdict legend — the `blocked` polarity flips by axis (read before interpreting a security row).**
> For a **detectability** level, `blocked` = the tool was *caught* by the guard (tool loses).
> For a **security** level (`comment_injection`), `blocked` = **the attack SUCCEEDED** — the tool
> obeyed the injected instruction and got owned (tool loses). Both still map to **FAIL**
> tool-centrically, so the outcome column is consistent; only the word "blocked" inverts. Security
> headlines read "attack succeeded within k trials" (a sensitivity floor at k=3), never a bare "ASR".

> **Correction (2026-06-26 ~20:40):** the two rows below were first logged as FAIL with "no cursor
> path" as the cause. Investigation disproved that. The behavioral score is computed server-side by
> **abs.incolumitas.com**, which was **fully down — HTTP 502 on /lib.js, /get, /classify, /store2**.
> An independent probe confirmed Feather *did* deliver a real cursor trajectory (**156 trusted
> `mousemove` events** with movement deltas) — the detector simply couldn't grade anyone while its
> backend was offline. Both runs are therefore **BLOCKED** (external outage), not bot-FAILs.
> Re-run when abs.incolumitas is back up to get a real behavioral score.

| When (UTC) | State | Score | Verdict | Motion | Evidence | Notes |
|---|---|---|---|---|---|---|
| 2026-06-26T19:28:24.570Z | UNSCORED | — | BLOCKED | (pre-motion) | runs/FAIL-2026-06-26T19-28-24-557Z.png | outage INFERRED for this timestamp (502 directly verified ~20:40, ~1h later). Also sent no motion, so ungradeable either way — treat as a pre-upgrade baseline, not a graded result. |
| 2026-06-26T20:32:02.670Z | UNSCORED | — | BLOCKED | v1-bezier-varspeed | runs/FAIL-2026-06-26T20-32-02-657Z.png | detector backend abs.incolumitas.com down (502, verified ~20:40). Motion WAS delivered (156 trusted mousemove events, verified independently) — the detector just couldn't grade it. Not a Feather failure. |
| 2026-06-27T13:05:15.588Z | UNSCORED | — | BLOCKED | v1-bezier-varspeed | runs/BLOCKED-2026-06-27T13-05-15-576Z.png | detector backend (abs.incolumitas.com) is down — it returned no score for anyone, so this run could not be graded. NOT a Feather failure; retry when the service is back up. |
