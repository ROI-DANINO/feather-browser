import Fastify from "fastify";
import type { FastifyInstance } from "fastify";
import * as fs from "fs";
import { randomBytes } from "crypto";
import type { SessionManager } from "../sessions/manager";
import type { IdentityManager } from "../identity/manager";
import type { FeatherPaths } from "../fs-layout";
import { injectRequestId, createOriginHostGuard } from "./middleware";
import { registerRoutes } from "./routes";
import { registerSsePlugin } from "./sse";
import { setBaseUrl } from "./server-info";

export interface StartHttpServerResult {
  server: FastifyInstance;
  port: number;
  token: string;
}

export async function startHttpServer(
  host: string,
  port: number,
  manager: SessionManager,
  paths: FeatherPaths,
  identityManager?: IdentityManager
): Promise<StartHttpServerResult> {
  const token = randomBytes(32).toString("hex");
  await fs.promises.writeFile(paths.tokenFile(), token, { encoding: "utf8", mode: 0o600 });

  const app = Fastify({ logger: false });

  app.addHook("onRequest", async (request) => { injectRequestId(request); });

  // Transport hardening (Gate A / A0): reject DNS-rebinding (foreign Host) and cross-origin CSRF
  // drive-bys (foreign Origin/Referer on state-changing methods) before token auth or body parsing.
  // Runs after injectRequestId so its 403 envelopes carry a requestId. See middleware.ts.
  app.addHook("onRequest", createOriginHostGuard());

  // Parse urlencoded bodies: the MFA local-page <form> submits code/humanToken/csrfNonce this way,
  // and the resume page's same-origin form POST (empty body) must not be rejected with 415. (The
  // on-page pause banner sets a CDP-polled DOM flag and makes no network request, so it is not a
  // consumer here.)
  app.addContentTypeParser("application/x-www-form-urlencoded", { parseAs: "string" }, (_req, body, done) => {
    try { done(null, Object.fromEntries(new URLSearchParams(body as string))); }
    catch (e) { done(e as Error, undefined); }
  });

  // Allow DELETE (and other verb) requests that include Content-Type: application/json but no body.
  // Without this override Fastify rejects them with FST_ERR_CTP_EMPTY_JSON_BODY.
  app.addContentTypeParser("application/json", { parseAs: "string" }, (_req, body, done) => {
    if (!body || (body as string).trim() === "") { done(null, {}); return; }
    try { done(null, JSON.parse(body as string)); }
    catch (e) { done(e as Error, undefined); }
  });

  await registerSsePlugin(app);

  registerRoutes(app, manager, paths, token, identityManager);

  await app.listen({ host, port });

  const address = app.server.address();
  if (!address || typeof address === "string") {
    throw new Error("Fastify server address is not available after listen().");
  }
  const actualPort = address.port;
  setBaseUrl(`http://${host}:${actualPort}`);

  const endpointData = {
    transport: "http",
    baseUrl: `http://${host}:${actualPort}`,
    tokenFile: paths.tokenFile(),
    pid: process.pid,
    startedAt: new Date().toISOString(),
  };
  await fs.promises.writeFile(paths.endpointFile(), JSON.stringify(endpointData, null, 2), "utf8");

  return { server: app, port: actualPort, token };
}
