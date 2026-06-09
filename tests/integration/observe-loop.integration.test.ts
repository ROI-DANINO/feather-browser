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

async function api(method: string, p: string, body?: object) {
  const res = await fetch(`${baseUrl}${p}`, {
    method,
    headers: { "Content-Type": "application/json", "X-Feather-Token": token },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json() };
}

beforeAll(async () => {
  tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "feather-int-observe-loop-"));
  await ensureDirs(tmpDir);
  const paths = new FeatherPaths(tmpDir);
  const lock = new ProfileLock(paths);
  const workspace = new WorkspaceMetadata(paths);
  manager = new SessionManager(paths, lock, workspace);
  const { port, token: t } = await startHttpServer("127.0.0.1", 0, manager, paths);
  token = t;
  baseUrl = `http://127.0.0.1:${port}`;
});

afterAll(async () => {
  const sessions = manager.list();
  await Promise.allSettled(sessions.map((s) => manager.close(s.sessionId, { force: true })));
  await fs.promises.rm(tmpDir, { recursive: true, force: true });
});

describe("observe golden loop", () => {
  it("observe -> act-by-ref -> diff -> REF_EXPIRED", async () => {
    // HTML page: clicking Go hides BOTH the input and itself (so obs2 has zero
    // interactive elements and every ref from obs1 is expired), and appends a
    // non-interactive paragraph so the diff's "removed" list is non-empty.
    const html = encodeURIComponent(
      `<input id="q" placeholder="search" />` +
      `<button id="go">Go</button>` +
      `<div id="result"></div>` +
      `<script>` +
      `document.getElementById('go').addEventListener('click',function(){` +
      `  document.getElementById('q').style.display='none';` +
      `  document.getElementById('go').style.display='none';` +
      `  document.getElementById('result').textContent='Done!';` +
      `});` +
      `</script>`
    );

    // 1. Launch a session and navigate to the data URL.
    const launch = await api("POST", "/v1/sessions", {
      workspaceId: "loop-ws",
      profile: { kind: "persistent" },
      browserMode: "chromium-headless-shell",
    });
    expect(launch.status).toBe(200);
    const sessionId = launch.body.data.sessionId as string;

    await api("POST", `/v1/sessions/${sessionId}/navigate`, {
      url: `data:text/html,${html}`,
      waitUntil: "domcontentloaded",
    });

    // 2. POST /observe — first observe; diff must be null.
    const obs1 = await api("POST", `/v1/sessions/${sessionId}/observe`, {});
    expect(obs1.status).toBe(200);
    expect(obs1.body.data.diff).toBeNull();

    const actions1: Array<{ ref: string; tag: string; name: string; state: string }> =
      obs1.body.data.actions;
    expect(actions1.length).toBeGreaterThan(0);

    // Capture refs for the input and the button.
    const inputAction = actions1.find(
      (a) => a.tag === "INPUT" || a.name === "search",
    );
    const buttonAction = actions1.find(
      (a) => a.tag === "BUTTON" && a.name === "Go",
    );
    expect(inputAction).toBeDefined();
    expect(buttonAction).toBeDefined();

    const inputRef = inputAction!.ref;
    const buttonRef = buttonAction!.ref;

    // 3. Act by ref: type into the input, then click the button.
    const typeRes = await api("POST", `/v1/sessions/${sessionId}/type`, {
      target: { by: "ref", ref: inputRef },
      text: "hello",
    });
    expect(typeRes.status).toBe(200);

    const clickRes = await api("POST", `/v1/sessions/${sessionId}/click`, {
      target: { by: "ref", ref: buttonRef },
    });
    expect(clickRes.status).toBe(200);

    // 4. POST /observe again — diff must be non-null and reflect the new "Done" button.
    const obs2 = await api("POST", `/v1/sessions/${sessionId}/observe`, {});
    expect(obs2.status).toBe(200);
    expect(obs2.body.data.diff).not.toBeNull();

    const diff = obs2.body.data.diff as {
      added: Array<{ ref?: string; desc?: string }>;
      removed: Array<{ desc?: string }>;
      changed: Array<{ ref?: string; change?: string; was?: string }>;
    };
    // Both the input and the Go button were hidden, so they should appear as removed.
    expect(diff.removed.length).toBeGreaterThan(0);

    // 5. POST /click with the input ref from step 2 (superseded by the step-4 observe)
    //    → expect 409 with error.code === "REF_EXPIRED".
    const staleClick = await api("POST", `/v1/sessions/${sessionId}/click`, {
      target: { by: "ref", ref: inputRef },
    });
    expect(staleClick.status).toBe(409);
    expect(staleClick.body.error.code).toBe("REF_EXPIRED");

    await api("DELETE", `/v1/sessions/${sessionId}`, { force: false });
  }, 60000);
});
