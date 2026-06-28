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

/** Read all RunRecords. Missing file ⇒ []. Blank lines skipped. */
export function readRuns(file: string): RunRecord[] {
  if (!existsSync(file)) return [];
  return readFileSync(file, "utf8")
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => RunRecord.parse(JSON.parse(line)));
}
