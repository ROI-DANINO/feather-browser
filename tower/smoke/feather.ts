// tower/smoke/feather.ts — opt-in live verification. NOT a unit test.
// Prereqs: a running Feather server (`npm run dev`, which writes endpoint.json + the token file)
// and ANTHROPIC_API_KEY in the environment. Drives Feather to a trivial public page and prints each step.
import Anthropic from "@anthropic-ai/sdk";
import { join } from "node:path";
import { featherAdapter } from "../core/adapters/feather";
import { FeatherClient, readFeatherEndpoint } from "../core/adapters/feather-client";
import { makeClaudeDecide } from "../core/agent/decide-claude";

async function main(): Promise<void> {
  const endpointFile = process.env.FEATHER_ENDPOINT_FILE ?? join(process.cwd(), "endpoint.json");
  const model = process.env.FEATHER_BRAIN_MODEL ?? "claude-opus-4-8";

  const endpoint = readFeatherEndpoint(endpointFile); // throws loud if Feather isn't running
  const client = new FeatherClient(endpoint);
  const decide = makeClaudeDecide(new Anthropic(), model); // new Anthropic() reads ANTHROPIC_API_KEY; throws if unset

  const adapter = featherAdapter({
    client,
    decide,
    maxSteps: 8,
    onStep: ({ step, action }) => console.log(`[smoke] step ${step}: ${JSON.stringify(action)}`),
  });

  console.log(`[smoke] driving Feather at ${endpoint.baseUrl} with model ${model}`);
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
