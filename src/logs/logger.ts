import * as fs from "fs";
import * as path from "path";
import type { FeatherPaths } from "../fs-layout";
import type { EventName } from "./events";
import { emitBusEvent } from "./bus";

export interface LogEvent {
  ts: string;
  level: "info" | "warn" | "error";
  event: EventName;
  sessionId?: string;
  requestId?: string;
  data?: Record<string, unknown>;
}

export class FeatherLogger {
  constructor(private readonly paths: FeatherPaths) {}

  async log(event: LogEvent): Promise<void> {
    // always fire on bus
    emitBusEvent({ event: event.event, sessionId: event.sessionId, data: event.data, ts: event.ts });

    // JSONL write only when sessionId present
    if (!event.sessionId) return;

    const logPath = this.paths.sessionLog(event.sessionId);
    const logDir = path.dirname(logPath);
    await fs.promises.mkdir(logDir, { recursive: true });

    const record: Record<string, unknown> = {
      ts: event.ts,
      level: event.level,
      event: event.event,
      sessionId: event.sessionId,
    };
    if (event.requestId !== undefined) record["requestId"] = event.requestId;
    if (event.data !== undefined) record["data"] = event.data;

    await fs.promises.appendFile(logPath, JSON.stringify(record) + "\n", "utf8");
  }
}
