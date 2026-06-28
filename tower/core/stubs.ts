// tower/core/stubs.ts
import type { Adapter, Grade, Level, Tower } from "./types";

/** A no-op adapter for exercising the runner before real tools exist. */
export function stubAdapter(opts: { id?: string; fail?: boolean } = {}): Adapter {
  return {
    id: opts.id ?? "stub",
    async run() {
      if (opts.fail) throw new Error("stub adapter failure");
    },
  };
}

/** A level whose grade() is fixed up front. Its task is derived from the id. */
export function stubLevel(id: string, grade: Grade): Level {
  return {
    id,
    task: { levelId: id, url: `https://tower.local/levels/${id}`, goal: `complete ${id}` },
    async grade() {
      return grade;
    },
  };
}

export function stubTower(id: string, levels: Level[]): Tower {
  return { id, levels };
}
