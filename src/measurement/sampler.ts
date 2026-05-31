// src/measurement/sampler.ts
import pidusage from "pidusage";

export interface Sample {
  ts: string;
  pids: Record<number, { rss: number; cpu: number }>;
}

export class ProcessSampler {
  private samples: Sample[] = [];
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly pids: number[],
    private readonly intervalMs: number = 500
  ) {}

  start(): void {
    if (this.timer !== null) return;
    this.timer = setInterval(async () => {
      const pidMap: Record<number, { rss: number; cpu: number }> = {};
      for (const pid of this.pids) {
        try {
          const stat = await pidusage(pid);
          pidMap[pid] = { rss: stat.memory, cpu: stat.cpu };
        } catch {
          // Process may be gone; push partial result without this pid
        }
      }
      this.samples.push({ ts: new Date().toISOString(), pids: pidMap });
    }, this.intervalMs);
    // Prevent timer from keeping the process alive
    if (this.timer.unref) this.timer.unref();
  }

  stop(): Sample[] {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    return this.samples;
  }
}
