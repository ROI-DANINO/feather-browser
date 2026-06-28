// tower/serve.ts — runnable entrypoint. Boots the control plane; on boot also runs a stub tower
// once and persists the record, so `npm run tower:serve` proves the whole spine on a clean checkout.
import { join } from "node:path";
import { performance } from "node:perf_hooks";
import { buildServer } from "./core/server";
import { runTower } from "./core/runner";
import { appendRun } from "./core/store";
import { stubAdapter, stubLevel, stubTower } from "./core/stubs";

const RESULTS = join(__dirname, "results", "runs.jsonl");

async function main(): Promise<void> {
  const app = buildServer({ onReport: (r) => console.log("[tower] sink report", r.detectorId, r.verdict) });

  // Prove the spine: drive a stub tower once and persist the record.
  const tower = stubTower("tower-1", [
    stubLevel("detect", { verdict: "ok", cause: null, suggestedFix: null }),
    stubLevel("security", { verdict: "blocked", cause: "stub canary leaked", suggestedFix: "add an injection guard" }),
  ]);
  const base = performance.now();
  const rec = await runTower(tower, stubAdapter(), {
    runId: `serve-${new Date().toISOString()}`,
    startedAt: new Date().toISOString(),
    now: () => performance.now() - base,
  });
  appendRun(RESULTS, rec);
  console.log(`[tower] stub run persisted -> ${RESULTS} (stoppedAtLevel=${rec.stoppedAtLevel})`);

  const port = Number(process.env.FEATHER_TOWER_PORT ?? 0);
  const address = await app.listen({ host: "127.0.0.1", port });
  console.log(`[tower] control plane listening at ${address}`);
  console.log(`[tower] try: curl ${address}/health  ·  ${address}/levels/placeholder`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
