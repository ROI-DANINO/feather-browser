import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import { ensureHumanAuth } from "./continuity";

type Env = Record<string, string | undefined>;

type FeatherEnvelope<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

type Target =
  | ({ by: "role"; role: string; name?: string; exact?: boolean } & { at?: "first" | "last" | number })
  | ({ by: "text"; text: string; exact?: boolean } & { at?: "first" | "last" | number })
  | ({ by: "placeholder"; text: string } & { at?: "first" | "last" | number })
  | ({ by: "testid"; testId: string } & { at?: "first" | "last" | number })
  | ({ by: "css"; selector: string } & { at?: "first" | "last" | number });

interface EndpointFile {
  baseUrl: string;
  tokenFile: string;
}

interface SessionLaunch {
  sessionId: string;
  pages: Array<{ pageId: string }>;
}

interface WaitStableOutput {
  text: string;
}

const CHATGPT_URL = process.env.HERO_DEMO_CHATGPT_URL ?? "https://chatgpt.com/";
const GMAIL_URL = process.env.HERO_DEMO_GMAIL_URL ?? "https://mail.google.com/mail/u/0/#inbox";
const PROMPT = process.env.HERO_DEMO_PROMPT ?? "hello world";
const RECIPIENT = process.env.HERO_DEMO_TO ?? "support@anthropic.com";
const SUBJECT = process.env.HERO_DEMO_SUBJECT ?? "ChatGPT hello world reply";

export function endpointFileFromEnv(env: Env = process.env): string {
  if (env.FEATHER_ENDPOINT_FILE && env.FEATHER_ENDPOINT_FILE.trim() !== "") {
    return env.FEATHER_ENDPOINT_FILE;
  }
  if (env.FEATHER_DIR && env.FEATHER_DIR.trim() !== "") {
    return path.join(env.FEATHER_DIR, "run", "endpoint.json");
  }
  if (env.XDG_RUNTIME_DIR && env.XDG_RUNTIME_DIR.trim() !== "") {
    return path.join(env.XDG_RUNTIME_DIR, "feather", "run", "endpoint.json");
  }
  const home = env.HOME;
  if (!home) throw new Error("HOME is not set; set FEATHER_ENDPOINT_FILE to Feather's endpoint.json path");
  return path.join(env.XDG_STATE_HOME ?? path.join(home, ".local", "state"), "feather", "run", "endpoint.json");
}

export function envelopeData<T>(envelope: FeatherEnvelope<T>): T {
  if (envelope.ok) return envelope.data;
  throw new Error(`Feather API error ${envelope.error.code}: ${envelope.error.message}`);
}

export function buildDraftBody(reply: string): string {
  return [
    "ChatGPT replied to `hello world`:",
    "",
    reply.trim(),
    "",
    "--",
    "Draft prepared by Feather Browser's headed hero demo. Not sent automatically.",
  ].join("\n");
}

export function redactPathForDisplay(filePath: string, home = process.env.HOME): string {
  if (!home) return filePath;
  return filePath.startsWith(home + path.sep) ? "~" + filePath.slice(home.length) : filePath;
}

class FeatherApi {
  constructor(private readonly baseUrl: string, private readonly token: string) {}

  async request<T>(method: string, route: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${route}`, {
      method,
      headers: {
        "X-Feather-Token": this.token,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const json = (await res.json()) as FeatherEnvelope<T>;
    return envelopeData(json);
  }
}

function readEndpoint(): EndpointFile {
  const endpointFile = endpointFileFromEnv();
  if (!fs.existsSync(endpointFile)) {
    throw new Error(
      `Feather endpoint not found at ${redactPathForDisplay(endpointFile)}. Start Feather with "npm run dev" first.`,
    );
  }
  const endpoint = JSON.parse(fs.readFileSync(endpointFile, "utf8")) as EndpointFile;
  if (!fs.existsSync(endpoint.tokenFile)) {
    throw new Error(`Feather token file not found at ${redactPathForDisplay(endpoint.tokenFile)}.`);
  }
  return endpoint;
}

async function tryTargets(
  label: string,
  targets: Target[],
  fn: (target: Target) => Promise<void>,
): Promise<Target> {
  const failures: string[] = [];
  for (const target of targets) {
    try {
      await fn(target);
      return target;
    } catch (err) {
      failures.push(`${JSON.stringify(target)} -> ${(err as Error).message}`);
    }
  }
  throw new Error(`${label} was not found. Tried:\n${failures.map((f) => `  - ${f}`).join("\n")}`);
}

async function pause(message: string): Promise<void> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  await new Promise<void>((resolve) => rl.question(message, () => resolve()));
  rl.close();
}

async function waitForVisible(api: FeatherApi, sessionId: string, target: Target, timeoutMs = 2000): Promise<void> {
  await api.request("POST", `/v1/sessions/${sessionId}/wait`, { target, until: "visible", timeoutMs });
}


async function typeInto(api: FeatherApi, sessionId: string, target: Target, text: string, mode: "fill" | "sequential" = "fill"): Promise<void> {
  await api.request("POST", `/v1/sessions/${sessionId}/type`, { target, text, mode, delayMs: 12, timeoutMs: 15000 });
}

async function click(api: FeatherApi, sessionId: string, target: Target): Promise<void> {
  await api.request("POST", `/v1/sessions/${sessionId}/click`, { target, timeoutMs: 15000 });
}

async function main(): Promise<void> {
  const endpoint = readEndpoint();
  const token = fs.readFileSync(endpoint.tokenFile, "utf8").trim();
  const api = new FeatherApi(endpoint.baseUrl, token);

  console.log(`Feather at ${endpoint.baseUrl}`);
  const workspaceId = process.env.FEATHER_WARM_WORKSPACE ?? "primary";
  console.log(`Launching warmed "${workspaceId}" profile in headed mode...`);

  const session = await api.request<SessionLaunch>("POST", "/v1/sessions", {
    workspaceId,
    profile: { kind: "persistent" },
    browserMode: "chromium-headed-cdp",
    viewport: { width: 1366, height: 900 },
  });

  const sessionId = session.sessionId;
  console.log(`Session ${sessionId} is visible. No screenshots/debug bundles will be created.`);

  try {
    // 1. Ensure human authentication (Google/Gmail) before starting the cross-site flow.
    // This implements the "Cookie Mine" pattern: agent piggybacks on human trust.
    await ensureHumanAuth(api, sessionId, {
      targetUrl: GMAIL_URL,
      checkTargets: [
        { by: "css", selector: "div[role='button'][gh='cm']" },
        { by: "role", role: "button", name: "Compose" },
        { by: "role", role: "button", name: "אימייל חדש" },
      ],
    });

    console.log("Opening ChatGPT...");
    await api.request("POST", `/v1/sessions/${sessionId}/navigate`, {
      url: CHATGPT_URL,
      waitUntil: "domcontentloaded",
      timeoutMs: 45000,
    });

    const promptTargets: Target[] = [
      { by: "css", selector: "#prompt-textarea" },
      { by: "css", selector: "[contenteditable='true'][id='prompt-textarea']" },
      { by: "css", selector: "textarea[data-testid='prompt-textarea']" },
      { by: "css", selector: "main [contenteditable='true']", at: "last" },
    ];
    const promptTarget = await tryTargets("ChatGPT prompt", promptTargets, (target) => waitForVisible(api, sessionId, target));

    console.log(`Typing prompt: ${PROMPT}`);
    await typeInto(api, sessionId, promptTarget, PROMPT, "sequential");

    const sendTargets: Target[] = [
      { by: "testid", testId: "send-button" },
      { by: "css", selector: "[data-testid='send-button']" },
      { by: "css", selector: "button[aria-label='Send prompt']" },
      { by: "css", selector: "button[aria-label*='Send']", at: "last" },
    ];
    await tryTargets("ChatGPT send button", sendTargets, (target) => click(api, sessionId, target));

    console.log("Waiting for ChatGPT response to settle...");
    const answerTargets: Target[] = [
      { by: "css", selector: "div[data-message-author-role='assistant']", at: "last" },
      { by: "css", selector: "article[data-testid^='conversation-turn-'] .markdown", at: "last" },
      { by: "css", selector: "main article", at: "last" },
    ];
    const answerTarget = await tryTargets("ChatGPT answer", answerTargets, (target) =>
      api.request("POST", `/v1/sessions/${sessionId}/wait`, {
        target,
        until: "stable",
        quietMs: 1600,
        pollMs: 250,
        timeoutMs: 120000,
      }).then(() => undefined),
    );
    const settled = await api.request<WaitStableOutput>("POST", `/v1/sessions/${sessionId}/wait`, {
      target: answerTarget,
      until: "stable",
      quietMs: 900,
      pollMs: 250,
      timeoutMs: 10000,
    });
    const reply = settled.text.trim();
    if (!reply) throw new Error("ChatGPT response settled, but extracted text was empty.");
    console.log(`Captured reply (${reply.length} chars).`);

    console.log("Opening Gmail...");
    await api.request("POST", `/v1/sessions/${sessionId}/navigate`, {
      url: GMAIL_URL,
      waitUntil: "domcontentloaded",
      timeoutMs: 45000,
    });

    const composeTargets: Target[] = [
      { by: "css", selector: "div[role='button'][gh='cm']" },
      { by: "role", role: "button", name: "אימייל חדש" },
      { by: "role", role: "button", name: "Compose" },
      { by: "text", text: "Compose" },
    ];
    await tryTargets("Gmail compose button", composeTargets, (target) => click(api, sessionId, target));

    const toTargets: Target[] = [
      { by: "css", selector: "div[name='to'][aria-label='אל']", at: "last" },
      { by: "css", selector: "div[name='to']", at: "last" },
      { by: "css", selector: "textarea[name='to']", at: "last" },
      { by: "css", selector: "input[aria-label*='To']", at: "last" },
      { by: "css", selector: "textarea[aria-label*='To']", at: "last" },
      { by: "css", selector: "textarea[aria-label*='אל']", at: "last" },
    ];
    const toTarget = await tryTargets("Gmail To field", toTargets, (target) => waitForVisible(api, sessionId, target, 5000));
    await typeInto(api, sessionId, toTarget, RECIPIENT, "sequential");
    await api.request("POST", `/v1/sessions/${sessionId}/press`, { target: toTarget, key: "Enter", timeoutMs: 5000 });

    const subjectTargets: Target[] = [
      { by: "css", selector: "input[name='subjectbox']", at: "last" },
      { by: "css", selector: "input[aria-label*='Subject']", at: "last" },
      { by: "css", selector: "input[aria-label*='נושא']", at: "last" },
    ];
    const subjectTarget = await tryTargets("Gmail subject field", subjectTargets, (target) => waitForVisible(api, sessionId, target, 5000));
    await typeInto(api, sessionId, subjectTarget, SUBJECT);

    const bodyTargets: Target[] = [
      { by: "css", selector: "div[role='textbox'][aria-label='גוף ההודעה']", at: "last" },
      { by: "css", selector: "div[aria-label='Message Body']", at: "last" },
      { by: "css", selector: "div[aria-label*='Message Body']", at: "last" },
      { by: "css", selector: "div[role='textbox'][g_editable='true']", at: "last" },
      { by: "css", selector: "div[contenteditable='true'][aria-label*='גוף']", at: "last" },
    ];
    const bodyTarget = await tryTargets("Gmail message body", bodyTargets, (target) => waitForVisible(api, sessionId, target, 5000));
    await typeInto(api, sessionId, bodyTarget, buildDraftBody(reply));

    console.log("Draft is ready and has NOT been sent.");
    await pause("Record the visible draft now. Press Enter here when you want Feather to close the session...");
    await api.request("DELETE", `/v1/sessions/${sessionId}`, { force: false });
    console.log("Session closed cleanly.");
  } catch (err) {
    console.error(`\nDemo stopped: ${(err as Error).message}`);
    console.error("The headed browser session is left open for inspection. Close it or call DELETE /v1/sessions when done.");
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(`\nHero demo failed before launch: ${(err as Error).message}`);
    process.exit(1);
  });
}
