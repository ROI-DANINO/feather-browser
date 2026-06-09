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

const ExtractSchema = z.object({
  pageId: z.string().optional(),
  recipe: z.object({
    fields: z.record(z.object({ selector: z.string(), type: z.enum(["text", "attribute"]), attribute: z.string().optional() })),
    limits: z.object({ items: z.number().int().positive().optional(), textChars: z.number().int().positive().optional() }).optional(),
  }),
});

const atField = z.union([z.enum(["first", "last"]), z.number().int().nonnegative()]).optional();
const TargetSchema = z.discriminatedUnion("by", [
  z.object({ by: z.literal("role"), role: z.string().min(1), name: z.string().optional(), exact: z.boolean().optional(), at: atField }),
  z.object({ by: z.literal("text"), text: z.string().min(1), exact: z.boolean().optional(), at: atField }),
  z.object({ by: z.literal("placeholder"), text: z.string().min(1), at: atField }),
  z.object({ by: z.literal("testid"), testId: z.string().min(1), at: atField }),
  z.object({ by: z.literal("css"), selector: z.string().min(1), at: atField }),
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
  const clickHandler = new ClickHandler(manager);
  const typeHandler = new TypeHandler(manager);
  const pressHandler = new PressHandler(manager);
  const waitHandler = new WaitHandler(manager);
  const awaitHumanHandler = new AwaitHumanHandler(manager);
  const selectOptionHandler = new SelectOptionHandler(manager);

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
      await reply.status(200).send(ok(requestId, closeResult));
    } catch (err) { await handleRouteError(err, request, reply); }
  });

  registerSseRoute(app, tokenAuth);
}
