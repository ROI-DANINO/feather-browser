// tower/core/render.ts
import type { LevelOutcome, LevelResult, RunRecord } from "./types";

const OUTCOME_CLASS: Record<LevelOutcome, string> = {
  WIN: "win",
  PARTIAL: "partial",
  FAIL: "fail",
  UNTESTABLE: "untestable",
};

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const STYLES = `
:root { --bg:#f6f7f9; --card:#fff; --ink:#1c2330; --muted:#6b7280; --line:#e6e8ec;
  --win:#1a8a4b; --partial:#b5760a; --fail:#c0392b; --untestable:#6b7280; }
* { box-sizing: border-box; }
body { margin:0; background:var(--bg); color:var(--ink);
  font:16px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif; }
main { max-width: 980px; margin: 0 auto; padding: 40px 24px; }
.run-head h1 { margin:0 0 4px; font-size:1.6rem; }
.run-head .meta { margin:0; color:var(--muted); font-size:.85rem; }
.run-head .stopped { display:inline-block; margin-top:10px; padding:2px 10px; border-radius:999px;
  background:#fdecea; color:var(--fail); font-size:.8rem; font-weight:600; }
.grid { margin-top:28px; display:grid; gap:18px;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
.card { background:var(--card); border:1px solid var(--line); border-radius:14px; padding:20px;
  box-shadow:0 1px 2px rgba(16,24,40,.04); }
.card-head { display:flex; align-items:center; gap:10px; }
.card-head h2 { margin:0; font-size:1.05rem; }
.chip { padding:2px 10px; border-radius:999px; font-size:.72rem; font-weight:700; color:#fff;
  letter-spacing:.03em; }
.chip.win { background:var(--win); } .chip.partial { background:var(--partial); }
.chip.fail { background:var(--fail); } .chip.untestable { background:var(--untestable); }
.verdict, .timing { margin:8px 0 0; color:var(--muted); font-size:.82rem; }
.cause { margin-top:12px; padding-top:12px; border-top:1px dashed var(--line); }
.cause p { margin:4px 0; font-size:.9rem; }
.cause .label { display:inline-block; min-width:38px; color:var(--muted); font-weight:600;
  text-transform:uppercase; font-size:.7rem; }
.ai-slot { margin-top:14px; padding:10px 12px; border:1px dashed var(--line); border-radius:10px;
  background:#fafbfc; color:var(--muted); font-size:.8rem; font-style:italic; }
.empty { background:var(--card); border:1px solid var(--line); border-radius:14px; padding:40px;
  text-align:center; color:var(--muted); }
.empty code { background:#eef0f3; padding:2px 6px; border-radius:6px; font-style:normal; }
`;

function renderCard(level: LevelResult): string {
  const cls = OUTCOME_CLASS[level.outcome];
  const parts = level.parts.map((p) => `${escapeHtml(p.part)} ${Math.round(p.ms)}ms`).join(" · ");
  const timing = `${parts}${parts ? " · " : ""}total ${Math.round(level.totalMs)}ms`;
  const causeBlock =
    level.cause !== null || level.suggestedFix !== null
      ? `<div class="cause">` +
        (level.cause !== null
          ? `<p><span class="label">cause</span> ${escapeHtml(level.cause)}</p>` : "") +
        (level.suggestedFix !== null
          ? `<p><span class="label">fix</span> ${escapeHtml(level.suggestedFix)}</p>` : "") +
        `</div>`
      : "";
  return `<article class="card">
    <div class="card-head"><span class="chip ${cls}">${level.outcome}</span>` +
      `<h2>${escapeHtml(level.levelId)}</h2></div>
    <p class="verdict">verdict: ${escapeHtml(level.verdict)}</p>
    <p class="timing">${timing}</p>
    ${causeBlock}
    <div class="ai-slot">AI summary — wired in Chunk 4</div>
  </article>`;
}

export function renderRun(record: RunRecord | null): string {
  const body =
    record === null
      ? `<div class="empty"><p>No runs recorded yet — run <code>npm run tower:serve</code>.</p></div>`
      : `<header class="run-head">
           <h1>${escapeHtml(record.towerId)} · ${escapeHtml(record.toolId)}</h1>
           <p class="meta">${escapeHtml(record.runId)} · ${escapeHtml(record.startedAt)}</p>` +
        (record.stoppedAtLevel !== null
          ? `<p class="stopped">stopped at: ${escapeHtml(record.stoppedAtLevel)}</p>` : "") +
        `</header>
         <section class="grid">${record.levels.map(renderCard).join("")}</section>`;
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Tower — run</title>
<style>${STYLES}</style></head>
<body><main>${body}</main></body></html>`;
}
