import * as fs from "fs";
import * as path from "path";
import type { BrowserContext, Page } from "playwright";

interface NetworkEntry {
  url: string;
  method: string;
  status: number | null;
  failure: string | null;
  timing: object | null;
}

interface ConsoleEntry {
  type: string;
  text: string;
  ts: string;
}

interface ErrorEntry {
  message: string;
  ts: string;
}

interface CommandEntry {
  [key: string]: unknown;
}

export class DebugCapture {
  private networkEvents: NetworkEntry[] = [];
  private consoleMessages: ConsoleEntry[] = [];
  private errorEvents: ErrorEntry[] = [];
  private commands: CommandEntry[] = [];

  constructor(
    private readonly context: BrowserContext,
    private readonly debugDir: string,
    private readonly opts: { trace?: boolean; screenshots?: boolean }
  ) {}

  async start(): Promise<void> {
    this.context.on("requestfinished", (request) => {
      void Promise.resolve(request.response()).then((response) => {
        this.networkEvents.push({
          url: request.url(),
          method: request.method(),
          status: response ? response.status() : null,
          failure: null,
          timing: request.timing() ?? null,
        });
      });
    });

    this.context.on("requestfailed", (request) => {
      this.networkEvents.push({
        url: request.url(),
        method: request.method(),
        status: null,
        failure: request.failure()?.errorText ?? "unknown",
        timing: request.timing() ?? null,
      });
    });

    const attachPageListeners = (page: Page): void => {
      page.on("console", (msg) => {
        this.consoleMessages.push({ type: msg.type(), text: msg.text(), ts: new Date().toISOString() });
      });
      page.on("pageerror", (err) => {
        this.errorEvents.push({ message: err.message, ts: new Date().toISOString() });
      });
    };

    for (const page of this.context.pages()) {
      attachPageListeners(page);
    }
    this.context.on("page", (page) => attachPageListeners(page));

    if (this.opts.trace) {
      await this.context.tracing.start({ screenshots: true, snapshots: true });
    }
  }

  recordCommand(cmd: CommandEntry): void {
    this.commands.push(cmd);
  }

  async finalize(): Promise<void> {
    await fs.promises.mkdir(this.debugDir, { recursive: true });

    const writeJsonl = async (filename: string, entries: object[]): Promise<void> => {
      const filePath = path.join(this.debugDir, filename);
      const lines = entries.map((e) => JSON.stringify(e)).join("\n");
      await fs.promises.writeFile(filePath, lines ? lines + "\n" : "", "utf8");
    };

    await writeJsonl("commands.jsonl", this.commands);
    await writeJsonl("network-summary.jsonl", this.networkEvents);
    await writeJsonl("console.jsonl", this.consoleMessages);
    await writeJsonl("errors.jsonl", this.errorEvents);

    if (this.opts.trace) {
      const tracePath = path.join(this.debugDir, "trace.zip");
      await this.context.tracing.stop({ path: tracePath });
    }
  }
}
