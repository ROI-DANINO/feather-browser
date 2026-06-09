// src/commands/perception/diff.ts
import type { ActionState, ObserveDiff } from "../../sessions/types";

export interface DiffRow {
  signature: string;
  ref: string;
  name: string;
  role: string | null;
  state: ActionState;
}

const label = (r: DiffRow) => `${r.role ?? r.state} '${r.name}'`;

/** Compare current rows against the previous observe. Returns null on first observe. */
export function computeDiff(prev: DiffRow[] | undefined, curr: DiffRow[]): ObserveDiff | null {
  if (!prev) return null;
  const prevBySig = new Map(prev.map((r) => [r.signature, r]));
  const currBySig = new Map(curr.map((r) => [r.signature, r]));

  const added: ObserveDiff["added"] = [];
  const changed: ObserveDiff["changed"] = [];
  for (const r of curr) {
    const before = prevBySig.get(r.signature);
    if (!before) { added.push({ ref: r.ref, desc: label(r) }); continue; }
    if (before.state !== r.state) changed.push({ ref: r.ref, change: `now-${r.state}`, was: before.state });
    else if (before.name !== r.name) changed.push({ ref: r.ref, change: "renamed", was: before.name });
  }
  const removed: ObserveDiff["removed"] = [];
  for (const r of prev) if (!currBySig.has(r.signature)) removed.push({ desc: label(r) });

  return { added, removed, changed };
}
