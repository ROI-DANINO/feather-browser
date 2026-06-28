// tower/core/store.ts
import { appendFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { RunRecord } from "./types";

/** Append one RunRecord as a JSON line. Truth lives in git as append-only NDJSON. Validates first. */
export function appendRun(file: string, rec: RunRecord): void {
  const valid = RunRecord.parse(rec); // throws on a malformed record — never write garbage
  mkdirSync(dirname(file), { recursive: true });
  appendFileSync(file, JSON.stringify(valid) + "\n");
}

/** Read all RunRecords. Missing file ⇒ []. Blank lines skipped. Corrupt/truncated lines are skipped
 *  with a console.warn — one bad line never loses the whole history. */
export function readRuns(file: string): RunRecord[] {
  if (!existsSync(file)) return [];
  const records: RunRecord[] = [];
  for (const line of readFileSync(file, "utf8").split("\n")) {
    if (line.trim().length === 0) continue;
    try {
      records.push(RunRecord.parse(JSON.parse(line)));
    } catch (e) {
      console.warn(`[tower/store] skipping bad line in ${file}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return records;
}
