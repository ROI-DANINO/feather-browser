// tower/core/adapters/feather-client.ts
import { readFileSync } from "node:fs";
import type { Observation } from "../agent/brain";

export interface FeatherEndpoint {
  baseUrl: string;
  token: string;
}

/** Read Feather's endpoint.json ({ baseUrl, tokenFile }) and the token file it points at. */
export function readFeatherEndpoint(endpointFile: string): FeatherEndpoint {
  const ep = JSON.parse(readFileSync(endpointFile, "utf8")) as { baseUrl: string; tokenFile: string };
  return { baseUrl: ep.baseUrl, token: readFileSync(ep.tokenFile, "utf8").trim() };
}

/** The browser-session surface the adapter needs from Feather. Drives over HTTP only. */
export interface BrowserSessionClient {
  createSession(): Promise<string>;
  navigate(sessionId: string, url: string): Promise<void>;
  observe(sessionId: string): Promise<Observation>;
  click(sessionId: string, ref: string): Promise<void>;
  type(sessionId: string, ref: string, text: string): Promise<void>;
  close(sessionId: string): Promise<void>;
}

interface Envelope<T> {
  ok: boolean;
  data?: T;
  error?: { code?: string };
}

export class FeatherClient implements BrowserSessionClient {
  constructor(
    private readonly ep: FeatherEndpoint,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  private async call<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await this.fetchImpl(`${this.ep.baseUrl}${path}`, {
      method,
      headers: { "X-Feather-Token": this.ep.token, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const env = (await res.json()) as Envelope<T>;
    if (!env.ok) throw new Error(`feather ${method} ${path} failed: ${env.error?.code ?? "UNKNOWN"}`);
    return env.data as T;
  }

  async createSession(): Promise<string> {
    const d = await this.call<{ sessionId: string }>("POST", "/v1/sessions", { profile: { kind: "disposable" } });
    return d.sessionId;
  }

  async navigate(sessionId: string, url: string): Promise<void> {
    await this.call("POST", `/v1/sessions/${sessionId}/navigate`, { url });
  }

  async observe(sessionId: string): Promise<Observation> {
    const d = await this.call<{
      url: string; title: string;
      actions: { ref: string; role: string | null; name: string; tag: string; state: string }[];
    }>("POST", `/v1/sessions/${sessionId}/observe`, {});
    return {
      url: d.url,
      title: d.title,
      elements: d.actions.map((a) => ({ ref: a.ref, role: a.role, name: a.name, tag: a.tag, state: a.state })),
    };
  }

  async click(sessionId: string, ref: string): Promise<void> {
    await this.call("POST", `/v1/sessions/${sessionId}/click`, { target: { by: "ref", ref } });
  }

  async type(sessionId: string, ref: string, text: string): Promise<void> {
    await this.call("POST", `/v1/sessions/${sessionId}/type`, { target: { by: "ref", ref }, text });
  }

  async close(sessionId: string): Promise<void> {
    await this.call("DELETE", `/v1/sessions/${sessionId}`);
  }
}
