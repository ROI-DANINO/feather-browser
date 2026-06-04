import Fastify from "fastify";
import type { FastifyInstance } from "fastify";
import * as fs from "fs";
import { randomBytes } from "crypto";
import type { SessionManager } from "../sessions/manager";
import type { FeatherPaths } from "../fs-layout";
import { injectRequestId } from "./middleware";
import { registerRoutes } from "./routes";
import { registerSsePlugin } from "./sse";

export interface StartHttpServerResult {
  server: FastifyInstance;
  port: number;
  token: string;
}

export async function startHttpServer(
  host: string,
  port: number,
  manager: SessionManager,
  paths: FeatherPaths
): Promise<StartHttpServerResult> {
  const token = randomBytes(32).toString("hex");
  await fs.promises.writeFile(paths.tokenFile(), token, { encoding: "utf8", mode: 0o600 });

  const app = Fastify({ logger: false });

  app.addHook("onRequest", async (request) => { injectRequestId(request); });

  await registerSsePlugin(app);

  registerRoutes(app, manager, paths, token);

  await app.listen({ host, port });

  const address = app.server.address();
  if (!address || typeof address === "string") {
    throw new Error("Fastify server address is not available after listen().");
  }
  const actualPort = address.port;

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
