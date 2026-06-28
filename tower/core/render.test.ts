// tower/core/render.test.ts
import { describe, it, expect } from "vitest";
import { renderRun, escapeHtml } from "./render";
import type { RunRecord, LevelResult } from "./types";

const winLevel: LevelResult = {
  levelId: "detect",
  verdict: "ok",
  outcome: "WIN",
  cause: null,
  suggestedFix: null,
  totalMs: 500,
  parts: [{ part: "drive", ms: 412 }, { part: "grade", ms: 88 }],
};

const failLevel: LevelResult = {
  levelId: "security",
  verdict: "blocked",
  outcome: "FAIL",
  cause: "stub canary leaked",
  suggestedFix: "add an injection guard",
  totalMs: 310,
  parts: [{ part: "drive", ms: 250 }, { part: "grade", ms: 60 }],
};

const record: RunRecord = {
  runId: "serve-2026-06-28T00:00:00.000Z",
  towerId: "tower-1",
  toolId: "feather",
  startedAt: "2026-06-28T00:00:00.000Z",
  levels: [winLevel, failLevel],
  stoppedAtLevel: "security",
};

describe("escapeHtml", () => {
  it("escapes HTML-significant characters", () => {
    expect(escapeHtml(`<script>"&'`)).toBe("&lt;script&gt;&quot;&amp;&#39;");
  });
});

describe("renderRun", () => {
  it("renders the empty state when record is null", () => {
    const html = renderRun(null);
    expect(html).toContain("No runs recorded yet");
    expect(html).toContain("npm run tower:serve");
  });

  it("renders the run header with tower, tool and stopped-at badge", () => {
    const html = renderRun(record);
    expect(html).toContain("tower-1");
    expect(html).toContain("feather");
    expect(html).toContain("stopped at: security");
  });

  it("a WIN card omits the cause/fix block", () => {
    const html = renderRun({ ...record, levels: [winLevel], stoppedAtLevel: null });
    expect(html).not.toContain('<div class="cause">'); // substring "cause" also lives in the CSS — match the block markup
    expect(html).toContain("WIN");
    expect(html).toContain("AI summary — wired in Chunk 4");
  });

  it("a FAIL card shows both cause and suggestedFix", () => {
    const html = renderRun({ ...record, levels: [failLevel] });
    expect(html).toContain("stub canary leaked");
    expect(html).toContain("add an injection guard");
  });

  it("renders all four outcome chips by label", () => {
    const four: LevelResult[] = (["WIN", "PARTIAL", "FAIL", "UNTESTABLE"] as const).map((o, i) => ({
      levelId: `l${i}`, verdict: "ok", outcome: o, cause: null, suggestedFix: null,
      totalMs: 1, parts: [],
    }));
    const html = renderRun({ ...record, levels: four, stoppedAtLevel: null });
    for (const [o, cls] of [["WIN", "win"], ["PARTIAL", "partial"], ["FAIL", "fail"], ["UNTESTABLE", "untestable"]]) {
      expect(html).toContain(o);
      expect(html).toContain(`class="chip ${cls}"`);
    }
  });

  it("escapes a grader-authored cause containing markup", () => {
    const html = renderRun({ ...record, levels: [{ ...failLevel, cause: "<script>x</script>" }] });
    expect(html).not.toContain("<script>x</script>");
    expect(html).toContain("&lt;script&gt;x&lt;/script&gt;");
  });

  it("escapes a grader-authored suggestedFix containing markup", () => {
    const html = renderRun({ ...record, levels: [{ ...failLevel, suggestedFix: "<img src=x onerror=alert(1)>" }] });
    expect(html).not.toContain("<img src=x onerror=alert(1)>");
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
  });
});
