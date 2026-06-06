// tests/integration/input-commands.integration.test.ts
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
  tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "feather-int-input-"));
  await ensureDirs(tmpDir);
  const paths = new FeatherPaths(tmpDir);
  const lock = new ProfileLock(paths);
  const workspace = new WorkspaceMetadata(paths);
  manager = new SessionManager(paths, lock, workspace);
  const { port, token: t } = await startHttpServer("127.0.0.1", 0, manager, paths);
  token = t;
  baseUrl = `http://127.0.0.1:${port}`;
  const launched = await api("POST", "/v1/sessions", {
    workspaceId: "input-ws",
    profile: { kind: "disposable" },
    browserMode: "chromium-new-headless",
  });
  sessionId = launched.body.data.sessionId;
});

afterAll(async () => {
  await Promise.allSettled(manager.list().map((s) => manager.close(s.sessionId, { force: true })));
  await fs.promises.rm(tmpDir, { recursive: true, force: true });
});

async function goto(html: string) {
  const { status } = await api("POST", `/v1/sessions/${sessionId}/navigate`, { url: dataUrl(html) });
  expect(status).toBe(200);
}

async function readResult() {
  const { body } = await api("POST", `/v1/sessions/${sessionId}/extract`, {
    recipe: { fields: { r: { selector: "#result", type: "text" } } },
  });
  return body.data.r as string | null;
}

describe("Input commands (real Chromium)", () => {
  it("type by placeholder + click by role/name updates the page", async () => {
    await goto(`<input placeholder="Message" id="m">
      <button onclick="document.getElementById('result').textContent=document.getElementById('m').value">Send</button>
      <div id="result"></div>`);
    expect((await api("POST", `/v1/sessions/${sessionId}/type`, {
      target: { by: "placeholder", text: "Message" }, text: "hello world",
    })).status).toBe(200);
    expect((await api("POST", `/v1/sessions/${sessionId}/click`, {
      target: { by: "role", role: "button", name: "Send" },
    })).status).toBe(200);
    expect(await readResult()).toBe("hello world");
  });

  it("type fill works on a contenteditable element", async () => {
    await goto(`<div contenteditable id="ed" oninput="document.getElementById('result').textContent=this.textContent"></div>
      <div id="result"></div>`);
    expect((await api("POST", `/v1/sessions/${sessionId}/type`, {
      target: { by: "css", selector: "#ed" }, text: "edited text",
    })).status).toBe(200);
    expect(await readResult()).toBe("edited text");
  });

  it('at:"last" targets the second of two matching elements', async () => {
    await goto(`<button onclick="document.getElementById('result').textContent='0'">Item</button>
      <button onclick="document.getElementById('result').textContent='1'">Item</button>
      <div id="result"></div>`);
    await api("POST", `/v1/sessions/${sessionId}/click`, { target: { by: "text", text: "Item", at: "last" } });
    expect(await readResult()).toBe("1");
    await api("POST", `/v1/sessions/${sessionId}/click`, { target: { by: "text", text: "Item", at: "first" } });
    expect(await readResult()).toBe("0");
  });

  it("press Enter on a target fires the keydown handler", async () => {
    await goto(`<input id="i" onkeydown="if(event.key==='Enter')document.getElementById('result').textContent='entered'">
      <div id="result"></div>`);
    await api("POST", `/v1/sessions/${sessionId}/type`, { target: { by: "css", selector: "#i" }, text: "x" });
    await api("POST", `/v1/sessions/${sessionId}/press`, { target: { by: "css", selector: "#i" }, key: "Enter" });
    expect(await readResult()).toBe("entered");
  });

  it('wait until:"stable" waits past the empty window and captures the full streamed text', async () => {
    await goto(`<button onclick="start()">Go</button><div id="answer"></div>
      <script>
        function start(){
          var a=document.getElementById('answer');
          setTimeout(function(){
            var words=['hello','streamed','world','done']; var i=0;
            var iv=setInterval(function(){ a.textContent += (i>0?' ':'')+words[i]; i++; if(i>=words.length) clearInterval(iv); }, 200);
          }, 400);
        }
      </script>`);
    await api("POST", `/v1/sessions/${sessionId}/click`, { target: { by: "role", role: "button", name: "Go" } });
    const { status, body } = await api("POST", `/v1/sessions/${sessionId}/wait`, {
      target: { by: "css", selector: "#answer" }, until: "stable", quietMs: 700, pollMs: 100, timeoutMs: 15000,
    });
    expect(status).toBe(200);
    expect(body.data.settled).toBe(true);
    expect(body.data.text).toBe("hello streamed world done");
    expect(body.data.elapsedMs).toBeGreaterThanOrEqual(900); // proves it didn't settle on the empty node / mid-stream
  });

  it("click on a missing target returns 404 ELEMENT_NOT_FOUND", async () => {
    await goto(`<div>nothing to click</div>`);
    const { status, body } = await api("POST", `/v1/sessions/${sessionId}/click`, {
      target: { by: "css", selector: "#does-not-exist" }, timeoutMs: 1000,
    });
    expect(status).toBe(404);
    expect(body.error.code).toBe("ELEMENT_NOT_FOUND");
  });
});
