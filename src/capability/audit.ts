import * as fs from "fs";
import * as path from "path";
import type { GrantEvent } from "./grants";

// ── Grant audit sink (Gate A / A1) ───────────────────────────────────────────
// The durable half of the dual audit surface (ADR-0010 §5): every grant lifecycle event is appended
// as one JSONL line to an append-only forensic log under the STATE root. The live SSE bus is the
// other half (wired at the server). Events are already redacted — the GrantEvent shape carries the
// record, never the nonce — so the sink writes them verbatim with a timestamp.

interface AuditLine {
  ts: string;
  type: GrantEvent["type"];
  grant: GrantEvent["grant"];
}

export class GrantAuditSink {
  constructor(private readonly file: string) {}

  /** Append one redacted event line. Synchronous append-only write — never truncates prior history. */
  record(event: GrantEvent): void {
    const line: AuditLine = { ts: new Date().toISOString(), type: event.type, grant: event.grant };
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    fs.appendFileSync(this.file, JSON.stringify(line) + "\n");
  }
}
