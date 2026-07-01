// tower/smoke/browser-use.ts — opt-in live verification. NOT a unit test.
// Prereqs: a venv at tower/adapters/browser-use/.venv with requirements.txt installed
// (see tower/adapters/browser-use/README.md) and ANTHROPIC_API_KEY in the environment.
// Drives the real browser-use framework to a trivial public page; the agent may wander or
// fail — that is a first-class outcome to report honestly, not a bug in the smoke.
import { join } from "node:path";
import { browserUseAdapter } from "../core/adapters/browser-use";

async function main(): Promise<void> {
  const shimPath = join(__dirname, "..", "adapters", "browser-use", "shim.py");
  // BROWSER_USE_PYTHON points at the venv python (e.g. tower/adapters/browser-use/.venv/bin/python).
  const python = process.env.BROWSER_USE_PYTHON;

  const adapter = browserUseAdapter({
    shimCommand: python ? [python, shimPath] : undefined, // undefined → adapter default (python3 + in-repo shim)
    maxSteps: 8,
    timeoutMs: 180_000,
  });

  console.log(`[smoke] driving browser-use via ${python ?? "python3"} ${shimPath}`);
  await adapter.run({
    levelId: "smoke",
    url: "https://example.com",
    goal: "Click the 'More information' link.",
  });
  console.log("[smoke] adapter.run completed — the drive finished (grading is external in PR-1).");
}

main().catch((e) => {
  console.error("[smoke] FAILED:", e);
  process.exit(1);
});
