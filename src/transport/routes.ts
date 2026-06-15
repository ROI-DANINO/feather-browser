import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z, ZodError } from "zod";
import { createTokenAuth } from "./middleware";
import type { ISessionManager } from "../sessions/manager";
import type { FeatherPaths } from "../fs-layout";
import { LaunchSessionHandler } from "../commands/launch";
import { GetSessionHandler, ListSessionsHandler } from "../commands/status";
import { NavigateHandler } from "../commands/navigate";
import { SnapshotHandler } from "../commands/snapshot";
import { ExtractHandler } from "../commands/extract";
import { ScreenshotHandler } from "../commands/screenshot";
import { DebugBundleHandler } from "../commands/debug-bundle";
import { CloseSessionHandler } from "../commands/close";
import { OpenTabHandler } from "../commands/open-tab";
import { CloseTabHandler } from "../commands/close-tab";
import { ListTabsHandler } from "../commands/list-tabs";
import { HealthHandler } from "../commands/health";
import { FeatherLogger } from "../logs/logger";
import { EVENTS } from "../logs/events";
import { ObserveHandler } from "../commands/observe";
import { DismissHandler } from "../commands/dismiss";
import { ClickHandler } from "../commands/click";
import { TypeHandler } from "../commands/type";
import { PressHandler } from "../commands/press";
import { WaitHandler } from "../commands/wait";
import type { WaitInput } from "../sessions/types";
import { AwaitHumanHandler } from "../commands/await-human";
import { SelectOptionHandler } from "../commands/select-option";
import type { AwaitHumanInput } from "../sessions/types";
import { peekPause, resumePause } from "../commands/pause-registry";
import { promptPage, confirmedPage, expiredPage } from "./resume-page";
import { registerSseRoute } from "./sse";
import { CapabilityService } from "../capability/service";
import { DangerousModePolicy } from "../capability/policy";
import type { CapabilityName } from "../capability/grants";
import { ExportCookiesHandler } from "../commands/export-cookies";
import { approvalPage, approvedPage, deniedPage, expiredApprovalPage, APPROVAL_CSP } from "./approval-page";
import { getBaseUrl } from "./server-info";

const LaunchSchema = z.object({
  workspaceId: z.string().optional(),
  profile: z.object({ kind: z.enum(["persistent", "disposable"]) }),
  browserMode: z.enum(["chromium-new-headless", "chromium-headless-shell", "chromium-headed-cdp"]).optional(),
  viewport: z.object({ width: z.number(), height: z.number() }).optional(),
  proxy: z.object({
    server: z.string(),
    username: z.string().optional(),
    password: z.string().optional(),
    bypass: z.string().optional(),
  }).nullable().optional(),
  debug: z.object({ trace: z.boolean().optional(), screenshots: z.boolean().optional() }).optional(),
});

const NavigateSchema = z.object({
  url: z.string().url({ message: "url must be a valid URL" }),
  pageId: z.string().optional(),
  waitUntil: z.enum(["load", "domcontentloaded", "networkidle", "commit"]).optional(),
  timeoutMs: z.number().int().positive().optional(),
});

const SnapshotSchema = z.object({
  pageId: z.string().optional(),
  limits: z.object({ textChars: z.number().int().positive().optional(), links: z.number().int().positive().optional() }).optional(),
});

const ObserveSchema = z.object({
  pageId: z.string().optional(),
  cap: z.number().int().positive().optional(),
  viewportOnly: z.boolean().optional(),
  includeText: z.boolean().optional(),
});

const DismissSchema = z.object({
  pageId: z.string().optional(),
  labels: z.array(z.string().min(1)).optional(),
});

const ExtractFieldSchema = z
  .object({
    selector: z.string(),
    type: z.enum(["text", "attribute", "value"]).optional(),
    attribute: z.string().optional(),
  })
  .transform((f) => ({ ...f, type: f.type ?? (f.attribute !== undefined ? ("attribute" as const) : ("text" as const)) }))
  .superRefine((f, ctx) => {
    if (f.type === "attribute" && f.attribute === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "type 'attribute' requires an 'attribute' name, e.g. { selector: \"a\", type: \"attribute\", attribute: \"href\" }",
      });
    }
  });

const ExtractRecipeSchema = z.object({
  fields: z.record(ExtractFieldSchema),
  limits: z.object({ items: z.number().int().positive().optional(), textChars: z.number().int().positive().optional() }).optional(),
});

// Agents intuitively POST { fields: {...} } without the recipe wrapper (3 of the showcase run's
// 7 API failures) — accept that flat shape by wrapping it.
export const ExtractSchema = z.preprocess(
  (body) => {
    if (body !== null && typeof body === "object" && !("recipe" in body) && "fields" in body) {
      const { pageId, ...rest } = body as Record<string, unknown>;
      return { ...(pageId !== undefined ? { pageId } : {}), recipe: rest };
    }
    return body;
  },
  z.object({ pageId: z.string().optional(), recipe: ExtractRecipeSchema })
);

const atField = z.union([z.enum(["first", "last"]), z.number().int().nonnegative()]).optional();
const TargetSchema = z.discriminatedUnion("by", [
  z.object({ by: z.literal("role"), role: z.string().min(1), name: z.string().optional(), exact: z.boolean().optional(), at: atField }),
  z.object({ by: z.literal("text"), text: z.string().min(1), exact: z.boolean().optional(), at: atField }),
  z.object({ by: z.literal("placeholder"), text: z.string().min(1), at: atField }),
  z.object({ by: z.literal("testid"), testId: z.string().min(1), at: atField }),
  z.object({ by: z.literal("css"), selector: z.string().min(1), at: atField }),
  z.object({ by: z.literal("ref"), ref: z.string().min(1) }),
]);

const ClickSchema = z.object({
  pageId: z.string().optional(),
  target: TargetSchema,
  timeoutMs: z.number().int().positive().optional(),
});

const TypeSchema = z.object({
  pageId: z.string().optional(),
  target: TargetSchema,
  text: z.string(),
  mode: z.enum(["fill", "sequential"]).optional(),
  delayMs: z.number().int().positive().optional(),
  timeoutMs: z.number().int().positive().optional(),
});

const PressSchema = z.object({
  pageId: z.string().optional(),
  target: TargetSchema.optional(),
  key: z.string().min(1),
  timeoutMs: z.number().int().positive().optional(),
});

const WaitSchema = z.union([
  z.object({
    pageId: z.string().optional(),
    target: TargetSchema,
    until: z.enum(["visible", "hidden", "attached", "detached"]),
    timeoutMs: z.number().int().positive().optional(),
  }),
  z.object({
    pageId: z.string().optional(),
    target: TargetSchema,
    until: z.literal("stable"),
    quietMs: z.number().int().positive().optional(),
    pollMs: z.number().int().positive().optional(),
    timeoutMs: z.number().int().positive().optional(),
  }),
]);

const SelectOptionSchema = z.object({
  pageId: z.string().optional(),
  target: TargetSchema,
  values: z.union([z.string(), z.array(z.string())]),
  timeoutMs: z.number().int().positive().optional(),
});

const AwaitHumanSchema = z.object({
  pageId: z.string().optional(),
  reason: z.string().min(1),
  resumeOn: z.object({
    target: TargetSchema,
    until: z.enum(["visible", "hidden", "attached", "detached"]),
  }).optional(),
  timeoutMs: z.number().int().positive().optional(),
  banner: z.boolean().optional(),
});

const ScreenshotSchema = z.object({ pageId: z.string().optional(), fullPage: z.boolean().optional() });
const CloseSchema = z.object({ force: z.boolean().optional(), quarantineDisposableProfile: z.boolean().optional() });

const CapabilitySchema = z.enum(["cdp-attach", "vault-unlock", "cookie-export"]);
const GrantRequestSchema = z.object({
  capability: CapabilitySchema,
  ttlMs: z.number().int().positive().optional(),
});

const ERROR_STATUS: Record<string, number> = {
  SESSION_NOT_FOUND: 404,
  PROFILE_LOCKED: 409,
  SESSION_NOT_RUNNING: 409,
  PAGE_NOT_FOUND: 404,
  VALIDATION_ERROR: 400,
  ELEMENT_NOT_FOUND: 404,
  ELEMENT_NOT_ACTIONABLE: 409,
  WAIT_TIMEOUT: 408,
  CANNOT_CLOSE_LAST_TAB: 409,
  REF_EXPIRED: 409,
  DANGEROUS_DISABLED: 403,
  GRANT_REQUIRED: 403,
  HUMAN_IN_CONTROL: 409,
};

function errorStatus(code: string): number { return ERROR_STATUS[code] ?? 500; }
function ok(requestId: string, data: unknown) { return { ok: true, requestId, data }; }
function fail(requestId: string, code: string, message: string, details?: unknown) {
  return { ok: false, requestId, error: { code, message, ...(details !== undefined ? { details } : {}) } };
}
function getRequestId(request: FastifyRequest): string { return (request as any).requestId ?? "unknown"; }

async function handleRouteError(err: unknown, request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const requestId = getRequestId(request);
  if (err instanceof ZodError) {
    await reply.status(400).send(fail(requestId, "VALIDATION_ERROR", "Request body validation failed.", err.errors));
    return;
  }
  const code: string = (err as any)?.code ?? "INTERNAL_ERROR";
  const message: string = (err as any)?.message ?? "An unexpected error occurred.";
  await reply.status(errorStatus(code)).send(fail(requestId, code, message));
}

export function registerRoutes(app: FastifyInstance, manager: ISessionManager, paths: FeatherPaths, token: string): void {
  const tokenAuth = createTokenAuth(token);

  // Instantiate handlers once
  const launchHandler = new LaunchSessionHandler(manager);
  const getSessionHandler = new GetSessionHandler(manager);
  const listSessionsHandler = new ListSessionsHandler(manager);
  const navigateHandler = new NavigateHandler(manager);
  const snapshotHandler = new SnapshotHandler(manager);
  const extractHandler = new ExtractHandler(manager);
  const screenshotHandler = new ScreenshotHandler(manager);  // NOTE: no paths arg
  const debugBundleHandler = new DebugBundleHandler(manager, paths);
  const closeHandler = new CloseSessionHandler(manager);
  const openTabHandler = new OpenTabHandler(manager);
  const closeTabHandler = new CloseTabHandler(manager);
  const listTabsHandler = new ListTabsHandler(manager);
  const observeHandler = new ObserveHandler(manager);
  const dismissHandler = new DismissHandler(manager);
  const clickHandler = new ClickHandler(manager);
  const typeHandler = new TypeHandler(manager);
  const pressHandler = new PressHandler(manager);
  const waitHandler = new WaitHandler(manager);
  const awaitHumanHandler = new AwaitHumanHandler(manager);
  const selectOptionHandler = new SelectOptionHandler(manager);
  const healthHandler = new HealthHandler(manager);
  const exportCookiesHandler = new ExportCookiesHandler(manager as any);

  // Gate A / A1: the server-owned capability service (grants + holds + approvals + dual audit).
  // Dangerous capabilities are off unless opted-in via FEATHER_DANGEROUS_CAPABILITIES (default: none).
  const capabilities = new CapabilityService({
    policy: DangerousModePolicy.fromEnv(process.env),
    auditFile: paths.grantAuditLog(),
  });

  // Per-action trace in the session JSONL: the H3 forensics took an investigation because 7.5
  // minutes of observe/click/type left no per-action record. Action name + status code ONLY —
  // never request bodies (type payloads carry user-typed text; redaction discipline stays intact).
  const actionLogger = new FeatherLogger(paths);
  app.addHook("onResponse", async (request, reply) => {
    if (request.method !== "POST") return;
    const m = request.url.match(/^\/v1\/sessions\/([^/]+)\/([a-z-]+)$/);
    if (!m) return;
    const [, sessionId, action] = m;
    if (action === "resume") return; // unauthenticated human route — keep its surface untouched
    // onResponse fires for EVERY response, including 401s short-circuited in tokenAuth and the
    // framework 404 handler — neither passed the auth boundary. Logging there would let a
    // tokenless client create arbitrary-named session log files (review finding). Only real,
    // registered sessions get log lines, and never off an auth failure.
    if (reply.statusCode === 401) return;
    try { manager.get(sessionId); } catch { return; }
    await actionLogger.log({
      ts: new Date().toISOString(),
      level: "info",
      event: EVENTS.ACTION_COMPLETED,
      sessionId,
      requestId: getRequestId(request),
      data: { action, statusCode: reply.statusCode },
    });
  });

  app.get("/health", async (_req: FastifyRequest, reply: FastifyReply) => {
    await reply.status(200).send({ ok: true, data: { status: "ok" } });
  });

  app.post("/v1/sessions", { preHandler: [tokenAuth] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const requestId = getRequestId(request);
    try {
      const input = LaunchSchema.parse(request.body);
      const sessionRecord = await launchHandler.execute(input, { requestId });
      await reply.status(200).send(ok(requestId, sessionRecord));
    } catch (err) { await handleRouteError(err, request, reply); }
  });

  app.get("/v1/sessions", { preHandler: [tokenAuth] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const requestId = getRequestId(request);
    try {
      const sessions = await listSessionsHandler.execute({}, { requestId });
      await reply.status(200).send(ok(requestId, sessions));
    } catch (err) { await handleRouteError(err, request, reply); }
  });

  app.get("/v1/sessions/:sessionId", { preHandler: [tokenAuth] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const requestId = getRequestId(request);
    try {
      const { sessionId } = request.params as { sessionId: string };
      const record = await getSessionHandler.execute({ sessionId }, { requestId });
      await reply.status(200).send(ok(requestId, record));
    } catch (err) { await handleRouteError(err, request, reply); }
  });

  app.post("/v1/sessions/:sessionId/navigate", { preHandler: [tokenAuth] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const requestId = getRequestId(request);
    try {
      const { sessionId } = request.params as { sessionId: string };
      const input = NavigateSchema.parse(request.body);
      const result = await navigateHandler.execute({ sessionId, ...input }, { requestId });
      await reply.status(200).send(ok(requestId, result));
    } catch (err) { await handleRouteError(err, request, reply); }
  });

  app.post("/v1/sessions/:sessionId/tabs", { preHandler: [tokenAuth] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const requestId = getRequestId(request);
    try {
      const { sessionId } = request.params as { sessionId: string };
      const result = await openTabHandler.execute({ sessionId }, { requestId });
      await reply.status(200).send(ok(requestId, result));
    } catch (err) { await handleRouteError(err, request, reply); }
  });

  app.get("/v1/sessions/:sessionId/health", { preHandler: [tokenAuth] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const requestId = getRequestId(request);
    try {
      const { sessionId } = request.params as { sessionId: string };
      const result = await healthHandler.execute({ sessionId }, { requestId });
      await reply.status(200).send(ok(requestId, result));
    } catch (err) { await handleRouteError(err, request, reply); }
  });

  app.get("/v1/sessions/:sessionId/tabs", { preHandler: [tokenAuth] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const requestId = getRequestId(request);
    try {
      const { sessionId } = request.params as { sessionId: string };
      const result = await listTabsHandler.execute({ sessionId }, { requestId });
      await reply.status(200).send(ok(requestId, result));
    } catch (err) { await handleRouteError(err, request, reply); }
  });

  app.delete("/v1/sessions/:sessionId/tabs/:pageId", { preHandler: [tokenAuth] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const requestId = getRequestId(request);
    try {
      const { sessionId, pageId } = request.params as { sessionId: string; pageId: string };
      const result = await closeTabHandler.execute({ sessionId, pageId }, { requestId });
      await reply.status(200).send(ok(requestId, result));
    } catch (err) { await handleRouteError(err, request, reply); }
  });

  app.post("/v1/sessions/:sessionId/snapshot", { preHandler: [tokenAuth] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const requestId = getRequestId(request);
    try {
      const { sessionId } = request.params as { sessionId: string };
      const input = SnapshotSchema.parse(request.body);
      const result = await snapshotHandler.execute({ sessionId, ...input }, { requestId });
      await reply.status(200).send(ok(requestId, result));
    } catch (err) { await handleRouteError(err, request, reply); }
  });

  app.post("/v1/sessions/:sessionId/observe", { preHandler: [tokenAuth] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const requestId = getRequestId(request);
    try {
      const { sessionId } = request.params as { sessionId: string };
      const input = ObserveSchema.parse(request.body ?? {});
      const result = await observeHandler.execute({ sessionId, ...input }, { requestId });
      await reply.status(200).send(ok(requestId, result));
    } catch (err) { await handleRouteError(err, request, reply); }
  });

  app.post("/v1/sessions/:sessionId/dismiss", { preHandler: [tokenAuth] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const requestId = getRequestId(request);
    try {
      const { sessionId } = request.params as { sessionId: string };
      const input = DismissSchema.parse(request.body ?? {});
      const result = await dismissHandler.execute({ sessionId, ...input }, { requestId });
      await reply.status(200).send(ok(requestId, result));
    } catch (err) { await handleRouteError(err, request, reply); }
  });

  app.post("/v1/sessions/:sessionId/extract", { preHandler: [tokenAuth] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const requestId = getRequestId(request);
    try {
      const { sessionId } = request.params as { sessionId: string };
      const input = ExtractSchema.parse(request.body);
      const result = await extractHandler.execute({ sessionId, ...input }, { requestId });
      await reply.status(200).send(ok(requestId, result));
    } catch (err) { await handleRouteError(err, request, reply); }
  });

  app.post("/v1/sessions/:sessionId/click", { preHandler: [tokenAuth] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const requestId = getRequestId(request);
    try {
      const { sessionId } = request.params as { sessionId: string };
      const input = ClickSchema.parse(request.body);
      const result = await clickHandler.execute({ sessionId, ...input }, { requestId });
      await reply.status(200).send(ok(requestId, result));
    } catch (err) { await handleRouteError(err, request, reply); }
  });

  app.post("/v1/sessions/:sessionId/type", { preHandler: [tokenAuth] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const requestId = getRequestId(request);
    try {
      const { sessionId } = request.params as { sessionId: string };
      const input = TypeSchema.parse(request.body);
      const result = await typeHandler.execute({ sessionId, ...input }, { requestId });
      await reply.status(200).send(ok(requestId, result));
    } catch (err) { await handleRouteError(err, request, reply); }
  });

  app.post("/v1/sessions/:sessionId/press", { preHandler: [tokenAuth] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const requestId = getRequestId(request);
    try {
      const { sessionId } = request.params as { sessionId: string };
      const input = PressSchema.parse(request.body);
      const result = await pressHandler.execute({ sessionId, ...input }, { requestId });
      await reply.status(200).send(ok(requestId, result));
    } catch (err) { await handleRouteError(err, request, reply); }
  });

  app.post("/v1/sessions/:sessionId/select-option", { preHandler: [tokenAuth] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const requestId = getRequestId(request);
    try {
      const { sessionId } = request.params as { sessionId: string };
      const input = SelectOptionSchema.parse(request.body);
      const result = await selectOptionHandler.execute({ sessionId, ...input }, { requestId });
      await reply.status(200).send(ok(requestId, result));
    } catch (err) { await handleRouteError(err, request, reply); }
  });

  app.post("/v1/sessions/:sessionId/wait", { preHandler: [tokenAuth] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const requestId = getRequestId(request);
    try {
      const { sessionId } = request.params as { sessionId: string };
      const input = WaitSchema.parse(request.body);
      const result = await waitHandler.execute({ sessionId, ...input } as WaitInput, { requestId });
      await reply.status(200).send(ok(requestId, result));
    } catch (err) { await handleRouteError(err, request, reply); }
  });

  app.post("/v1/sessions/:sessionId/await-human", { preHandler: [tokenAuth] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const requestId = getRequestId(request);
    try {
      const { sessionId } = request.params as { sessionId: string };
      const input = AwaitHumanSchema.parse(request.body);
      const result = await awaitHumanHandler.execute({ sessionId, ...input } as AwaitHumanInput, { requestId });
      await reply.status(200).send(ok(requestId, result));
    } catch (err) { await handleRouteError(err, request, reply); }
  });

  // Human-facing resume routes: NO API token (a browser click can't send the header).
  // Security is the single-use, unguessable per-pause token in the query string (local-only).
  app.get("/v1/sessions/:sessionId/resume", async (request: FastifyRequest, reply: FastifyReply) => {
    const { token: resumeToken } = (request.query as { token?: string }) ?? {};
    const info = resumeToken ? peekPause(resumeToken) : undefined;
    await reply.status(200).type("text/html")
      .send(info ? promptPage(info.reason) : expiredPage());
  });

  app.post("/v1/sessions/:sessionId/resume", async (request: FastifyRequest, reply: FastifyReply) => {
    const { sessionId } = request.params as { sessionId: string };
    const { token: resumeToken } = (request.query as { token?: string }) ?? {};
    const settled = resumeToken ? resumePause(resumeToken, sessionId) : false;
    await reply.status(200).type("text/html")
      .send(settled ? confirmedPage() : expiredPage());
  });

  // ── Gate A / A1: capability grants ─────────────────────────────────────────
  // Agent-facing: request a Dangerous-tier grant. The response carries ONLY {grant} — never the
  // approval URL or the humanToken (ADR-0010: the agent never holds a grant secret). The approval
  // link is surfaced to the HUMAN via the server console + the SSE bus.
  app.post("/v1/sessions/:sessionId/grants", { preHandler: [tokenAuth] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const requestId = getRequestId(request);
    try {
      const { sessionId } = request.params as { sessionId: string };
      const { capability, ttlMs } = GrantRequestSchema.parse(request.body);
      manager.get(sessionId); // 404 for an unknown session before minting anything
      const result = capabilities.requestGrant(sessionId, capability as CapabilityName, ttlMs);
      if (!result.ok) {
        await reply.status(403).send(fail(requestId, "DANGEROUS_DISABLED",
          `Capability '${capability}' is not enabled. Set FEATHER_DANGEROUS_CAPABILITIES to opt in.`));
        return;
      }
      const url = `${getBaseUrl()}${result.approvalPath}`;
      // The human's out-of-band channel: console now; the visual shell adds real notifications later.
      console.log(`\n[Feather] Capability approval needed — ${capability} on ${sessionId}\n  Approve: ${url}\n`);
      await reply.status(200).send(ok(requestId, { grant: result.grant }));
    } catch (err) { await handleRouteError(err, request, reply); }
  });

  // Human-facing approval page: NO API token (a browser click can't send the header). Security is
  // the single-use humanToken in the URL + a per-page CSRF nonce + a strict CSP with no external
  // resources. The global A0 Origin/Host guard sits in front of both routes.
  app.get("/v1/approvals/:humanToken", async (request: FastifyRequest, reply: FastifyReply) => {
    const { humanToken } = request.params as { humanToken: string };
    const view = capabilities.peekApproval(humanToken);
    await reply.header("content-security-policy", APPROVAL_CSP).type("text/html").status(200).send(
      view
        ? approvalPage({
            humanToken,
            sessionId: view.grant.sessionId,
            capability: view.grant.capability,
            ttlSeconds: Math.round(view.grant.ttlMs / 1000),
            csrfNonce: view.csrfNonce,
          })
        : expiredApprovalPage(),
    );
  });

  app.post("/v1/approvals/:humanToken", async (request: FastifyRequest, reply: FastifyReply) => {
    const { humanToken } = request.params as { humanToken: string };
    // action + csrf ride in the query string (Feather discards urlencoded bodies — see approval-page).
    const { action: rawAction, csrf } = (request.query as { action?: string; csrf?: string }) ?? {};
    const action = rawAction === "deny" ? "deny" : "approve";
    const result = capabilities.resolveApproval(humanToken, csrf ?? "", action);
    const html = !result.ok
      ? expiredApprovalPage()
      : result.outcome === "approved" ? approvedPage() : deniedPage();
    await reply.header("content-security-policy", APPROVAL_CSP).type("text/html").status(200).send(html);
  });

  // The first real Dangerous-tier door: export the session's cookies (login tokens). Gated by a
  // spent capability grant — no grant, no cookies. Off entirely unless cookie-export is opted-in.
  app.post("/v1/sessions/:sessionId/cookies/export", { preHandler: [tokenAuth] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const requestId = getRequestId(request);
    try {
      const { sessionId } = request.params as { sessionId: string };
      manager.get(sessionId);
      if (!capabilities.isEnabled("cookie-export")) {
        await reply.status(403).send(fail(requestId, "DANGEROUS_DISABLED",
          "Capability 'cookie-export' is not enabled. Set FEATHER_DANGEROUS_CAPABILITIES to opt in."));
        return;
      }
      const consumed = capabilities.consume(sessionId, "cookie-export");
      if (!consumed.ok) {
        await reply.status(403).send(fail(requestId, "GRANT_REQUIRED",
          `No usable cookie-export grant for this session (${consumed.reason}). Request one via POST /v1/sessions/:id/grants and approve it.`));
        return;
      }
      const result = await exportCookiesHandler.execute({ sessionId }, { requestId });
      await reply.status(200).send(ok(requestId, result));
    } catch (err) { await handleRouteError(err, request, reply); }
  });

  app.post("/v1/sessions/:sessionId/screenshot", { preHandler: [tokenAuth] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const requestId = getRequestId(request);
    try {
      const { sessionId } = request.params as { sessionId: string };
      const input = ScreenshotSchema.parse(request.body);
      const result = await screenshotHandler.execute({ sessionId, ...input }, { requestId });
      await reply.status(200).send(ok(requestId, result));
    } catch (err) { await handleRouteError(err, request, reply); }
  });

  app.post("/v1/sessions/:sessionId/debug-bundle", { preHandler: [tokenAuth] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const requestId = getRequestId(request);
    try {
      const { sessionId } = request.params as { sessionId: string };
      const result = await debugBundleHandler.execute({ sessionId }, { requestId });
      await reply.status(200).send(ok(requestId, result));
    } catch (err) { await handleRouteError(err, request, reply); }
  });

  app.delete("/v1/sessions/:sessionId", { preHandler: [tokenAuth] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const requestId = getRequestId(request);
    try {
      const { sessionId } = request.params as { sessionId: string };
      const input = CloseSchema.parse(request.body ?? {});
      const closeResult = await closeHandler.execute({ sessionId, ...input }, { requestId });
      // Revoke hammer: a closed session's grants/holds die with it (auto-revoke on close, ADR-0010).
      await capabilities.revokeSession(sessionId);
      await reply.status(200).send(ok(requestId, closeResult));
    } catch (err) { await handleRouteError(err, request, reply); }
  });

  registerSseRoute(app, tokenAuth);
}
