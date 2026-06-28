// tower/core/timing.ts
import type { PartTiming } from "./types";

export interface Stopwatch {
  part<T>(name: string, fn: () => Promise<T>): Promise<T>;
  parts(): PartTiming[];
  totalMs(): number;
}

/** A stopwatch that times named parts. `now` is injected so tests are deterministic. */
export function stopwatch(now: () => number): Stopwatch {
  const recorded: PartTiming[] = [];
  return {
    async part<T>(name: string, fn: () => Promise<T>): Promise<T> {
      const start = now();
      try {
        return await fn();
      } finally {
        recorded.push({ part: name, ms: now() - start });
      }
    },
    parts: () => recorded.slice(),
    totalMs: () => recorded.reduce((sum, p) => sum + p.ms, 0),
  };
}
