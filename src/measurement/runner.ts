// src/measurement/runner.ts
import * as fs from "fs";
import * as path from "path";
import type { BrowserMode } from "../sessions/types";

export interface ScenarioTimings {
  launchMs: number;
  navigateMs: number;
  snapshotMs: number;
  screenshotMs: number;
  extractMs: number;
  closeMs: number;
  totalMs: number;
}

export interface ScenarioResult {
  browserMode: BrowserMode;
  workspaceId: string;
  timings: ScenarioTimings;
  profileDirSizeBefore: number; // bytes, measured after screenshot, before close
  profileDirSizeAfter: number;  // bytes, measured after close
  debugBundleSize: number;      // bytes, measured after close
  nodePid: number;
}

export class MeasurementRunner {
  constructor(
    private readonly baseUrl: string,
    private readonly token: string,
    private readonly featherDir: string
  ) {}

  async run(browserMode: BrowserMode): Promise<ScenarioResult> {
    const workspaceId = `measure-${browserMode}-${Date.now()}`;
    const totalStart = Date.now();

    // Step 1: Launch session
    const launchStart = Date.now();
    const launchRes = await this.req("POST", "/v1/sessions", {
      workspaceId,
      profile: { kind: "persistent" },
      browserMode,
      viewport: { width: 1280, height: 800 },
      debug: { trace: true, screenshots: true },
    } as any);
    const launchMs = Date.now() - launchStart;
    const sessionId: string = launchRes.data.sessionId;
    const profilePath: string = launchRes.data.profilePath;

    // Step 2: Navigate
    const navigateStart = Date.now();
    await this.req("POST", `/v1/sessions/${sessionId}/navigate`, {
      url: "https://example.com",
      waitUntil: "domcontentloaded",
      timeoutMs: 30000,
    });
    const navigateMs = Date.now() - navigateStart;

    // Step 3: Snapshot
    const snapshotStart = Date.now();
    await this.req("POST", `/v1/sessions/${sessionId}/snapshot`, {});
    const snapshotMs = Date.now() - snapshotStart;

    // Step 4: Screenshot
    const screenshotStart = Date.now();
    await this.req("POST", `/v1/sessions/${sessionId}/screenshot`, { fullPage: false });
    const screenshotMs = Date.now() - screenshotStart;

    // Step 5: Extract
    const extractStart = Date.now();
    await this.req("POST", `/v1/sessions/${sessionId}/extract`, {
      recipe: {
        fields: {
          heading: { selector: "h1", type: "text" },
        },
      },
    });
    const extractMs = Date.now() - extractStart;

    // Step 6: Debug bundle
    await this.req("POST", `/v1/sessions/${sessionId}/debug-bundle`, {});

    // Step 6.5: Measure profile dir size before close
    const profileDirSizeBefore = await this.measureDirSize(
      this.resolveFeatherPath(profilePath)
    );

    // Step 7: Close session
    const closeStart = Date.now();
    await this.req("DELETE", `/v1/sessions/${sessionId}`, { force: false });
    const closeMs = Date.now() - closeStart;

    const totalMs = Date.now() - totalStart;

    // Step 8: Measure profile dir size after close
    const profileDirSizeAfter = await this.measureDirSize(
      this.resolveFeatherPath(profilePath)
    );

    // Step 9: Measure debug bundle size
    const debugBundlePath = path.join(this.featherDir, "debug", sessionId);
    const debugBundleSize = await this.measureDirSize(debugBundlePath);

    return {
      browserMode,
      workspaceId,
      timings: {
        launchMs,
        navigateMs,
        snapshotMs,
        screenshotMs,
        extractMs,
        closeMs,
        totalMs,
      },
      profileDirSizeBefore,
      profileDirSizeAfter,
      debugBundleSize,
      nodePid: process.pid,
    };
  }

  private resolveFeatherPath(p: string): string {
    if (path.isAbsolute(p)) return p;
    // Strip leading ".feather/" prefix if present, then join with featherDir
    const stripped = p.replace(/^\.feather[/\\]/, "");
    return path.join(this.featherDir, stripped);
  }

  private async req(method: string, endpoint: string, body?: object): Promise<any> {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Feather-Token": this.token,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json() as any;
    if (!json.ok) {
      throw new Error(`API error ${res.status}: ${JSON.stringify(json.error)}`);
    }
    return json;
  }

  async measureDirSize(dirPath: string): Promise<number> {
    let total = 0;
    try {
      const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          total += await this.measureDirSize(full);
        } else if (entry.isFile()) {
          try {
            const stat = await fs.promises.stat(full);
            total += stat.size;
          } catch {
            // skip unreadable file
          }
        }
      }
    } catch {
      // dir not found → 0
    }
    return total;
  }
}
