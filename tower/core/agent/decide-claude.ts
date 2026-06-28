// tower/core/agent/decide-claude.ts
import type Anthropic from "@anthropic-ai/sdk";
import { Action } from "./action";
import type { Decide, Observation } from "./brain";

const SYSTEM =
  "You drive a web browser to accomplish a goal. Each turn you see the current page's actionable " +
  "elements (each with a ref). Choose exactly ONE action by calling a tool. Use 'click' or 'type' " +
  "to make progress, 'done' when the goal is accomplished, or 'give_up' if it is impossible from here. " +
  "Only use refs that appear in the current element list — never invent a ref.";

// The four-verb vocabulary, expressed as forced tools (tool_choice: "any").
const ACTION_TOOLS: Anthropic.Tool[] = [
  {
    name: "click", description: "Click an element by its ref to progress toward the goal.",
    input_schema: { type: "object", additionalProperties: false, required: ["ref"],
      properties: { ref: { type: "string" }, reason: { type: "string" } } },
  },
  {
    name: "type", description: "Type text into an input/textarea element by its ref.",
    input_schema: { type: "object", additionalProperties: false, required: ["ref", "text"],
      properties: { ref: { type: "string" }, text: { type: "string" }, reason: { type: "string" } } },
  },
  {
    name: "done", description: "The goal has been accomplished. Stop.",
    input_schema: { type: "object", additionalProperties: false, required: [],
      properties: { reason: { type: "string" } } },
  },
  {
    name: "give_up", description: "The goal cannot be accomplished from this page. Stop.",
    input_schema: { type: "object", additionalProperties: false, required: [],
      properties: { reason: { type: "string" } } },
  },
];

function renderPrompt(goal: string, obs: Observation, step: number): string {
  const lines = obs.elements.map(
    (e) => `- ${e.ref} [${e.tag}${e.role ? `/${e.role}` : ""}] "${e.name}" (${e.state})`,
  );
  return [
    `Goal: ${goal}`,
    `Step: ${step}`,
    `Page: ${obs.title} — ${obs.url}`,
    `Actionable elements:`,
    lines.length ? lines.join("\n") : "(none)",
    `Choose one action by calling a tool.`,
  ].join("\n");
}

/** Build a Decide backed by Claude tool-use. The client is injected so tests pass a stub. */
export function makeClaudeDecide(client: Pick<Anthropic, "messages">, model: string): Decide {
  return async ({ goal, observation, step }) => {
    const res = await client.messages.create({
      model,
      max_tokens: 1024,
      system: SYSTEM,
      tools: ACTION_TOOLS,
      tool_choice: { type: "any" },
      messages: [{ role: "user", content: renderPrompt(goal, observation, step) }],
    });
    const toolUse = res.content.find((b) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      throw new Error("brain: the model did not choose an action (no tool_use block)");
    }
    return Action.parse({ kind: toolUse.name, ...(toolUse.input as Record<string, unknown>) });
  };
}
