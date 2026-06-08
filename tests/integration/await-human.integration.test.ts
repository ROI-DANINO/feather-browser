import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { FeatherPaths, ensureDirs } from "../../src/fs-layout";
import { ProfileLock } from "../../src/profiles/lock";
import { WorkspaceMetadata } from "../../src/profiles/workspace";
import { SessionManager } from "../../src/sessions/manager";
import { startHttpServer } from "../../src/transport/http";

let baseUrl: string;
let token: string;
let manager: SessionManager;
let tmpDir: string;
let sessionId: string;

async function api(method: string, p: string, body?: object) {
  const res = await fetch(`${baseUrl}${p}`, {
    method,
    headers: { "Content-Type": "application/json", "X-Feather-Token": token },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json() };
}

const dataUrl = (html: string) => "data:text/html," + encodeURIComponent(html);

beforeAll(async () => {
  tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "feather-int-await-"));
  await ensureDirs(tmpDir);
  const paths = new FeatherPaths(tmpDir);
  manager = new SessionManager(paths, new ProfileLock(paths), new WorkspaceMetadata(paths));
  const started = await startHttpServer("127.0.0.1", 0, manager, paths);
  token = started.token;
  baseUrl = `http://127.0.0.1:${started.port}`;
  const launched = await api("POST", "/v1/sessions", {
    workspaceId: "await-ws", profile: { kind: "disposable" }, browserMode: "chromium-new-headless",
  });
  sessionId = launched.body.data.sessionId;
});

afterAll(async () => {
  await Promise.allSettled(manager.list().map((s) => manager.close(s.sessionId, { force: true })));
  await fs.promises.rm(tmpDir, { recursive: true, force: true });
});

async function captureResumePath(reason: string, timeoutMs: number) {
  const events = await fetch(`${baseUrl}/v1/events`, { headers: { "X-Feather-Token": token } });
  const reader = events.body!.getReader();
  const dec = new TextDecoder();
  const pausePromise = api("POST", `/v1/sessions/${sessionId}/await-human`, { reason, timeoutMs });

  let resumePath = "";
  while (!resumePath) {
    const { value } = await reader.read();
    const m = dec.decode(value).match(/"resumePath":"([^"]+)"/);
    if (m) resumePath = m[1];
  }
  await reader.cancel();
  return { resumePath, pausePromise };
}

describe("await-human (real Chromium)", () => {
  it("returns resumedBy:'timeout' when nothing happens", async () => {
    const { status, body } = await api("POST", `/v1/sessions/${sessionId}/await-human`, {
      reason: "nobody home", timeoutMs: 300,
    });
    expect(status).toBe(200);
    expect(body.data.resumedBy).toBe("timeout");
  });

  it("returns resumedBy:'signal' when the resumeOn element appears", async () => {
    await api("POST", `/v1/sessions/${sessionId}/navigate`, {
      url: dataUrl(`<body><script>setTimeout(()=>{const d=document.createElement('div');d.id='done';d.textContent='ok';document.body.appendChild(d);},300)</script></body>`),
    });
    const { body } = await api("POST", `/v1/sessions/${sessionId}/await-human`, {
      reason: "waiting for #done", timeoutMs: 5000,
      resumeOn: { target: { by: "css", selector: "#done" }, until: "visible" },
    });
    expect(body.data.resumedBy).toBe("signal");
  });

  it("returns resumedBy:'human' when the resume link is POSTed (no API token)", async () => {
    const { resumePath, pausePromise } = await captureResumePath("tap resume", 10000);

    const resumeRes = await fetch(`${baseUrl}${resumePath}`, { method: "POST" });
    expect(resumeRes.status).toBe(200);
    expect(await resumeRes.text()).toMatch(/Resumed/);

    const { body } = await pausePromise;
    expect(body.data.resumedBy).toBe("human");
  });

  it("serves the prompt page on GET resume without an API token", async () => {
    const { resumePath, pausePromise } = await captureResumePath("GET me", 10000);

    const getRes = await fetch(`${baseUrl}${resumePath}`); // no token header
    expect(getRes.status).toBe(200);
    expect(await getRes.text()).toContain("GET me");

    await fetch(`${baseUrl}${resumePath}`, { method: "POST" }); // settle so the test ends
    await pausePromise;
  });
});
