import { loadConfig } from "./config";
import { FeatherPaths, ensureDirs } from "./fs-layout";
import { ProfileLock } from "./profiles/lock";
import { WorkspaceMetadata } from "./profiles/workspace";
import { SessionManager } from "./sessions/manager";
import { IdentityStore } from "./identity/store";
import { IdentityManager } from "./identity/manager";
import { FeatherLogger } from "./logs/logger";
import { EVENTS } from "./logs/events";
import { startHttpServer } from "./transport/http";

async function main(): Promise<void> {
  const config = loadConfig();
  const paths = new FeatherPaths(config.dirs);
  await ensureDirs(config.dirs);

  const lock = new ProfileLock(paths);
  const workspace = new WorkspaceMetadata(paths);
  const manager = new SessionManager(paths, lock, workspace);
  const logger = new FeatherLogger(paths);

  // Identity Model (Phase 5a): named handles over warmed profiles. Wired one-way — the session
  // manager resolves an identityId → workspaceId via the resolver seam (no import cycle).
  const identityManager = new IdentityManager(new IdentityStore(paths.identitiesDir()), paths, manager, logger);
  manager.setIdentityResolver(identityManager);

  const { port, token: _token } = await startHttpServer(config.host, config.port, manager, paths, identityManager);

  await logger.log({
    ts: new Date().toISOString(),
    level: "info",
    event: EVENTS.SERVICE_STARTED,
    data: { port, host: config.host },
  });
  console.log(`Feather Browser service running at http://${config.host}:${port}`);
  console.log(`Token file: ${paths.tokenFile()}`);
  console.log(`Endpoint:   ${paths.endpointFile()}`);

  async function shutdown(): Promise<void> {
    console.log("Feather Browser shutting down...");
    const sessions = manager.list();
    await Promise.allSettled(sessions.map((s) => manager.close(s.sessionId, { force: true })));
    process.exit(0);
  }

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
