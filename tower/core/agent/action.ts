// tower/core/agent/action.ts
import { z } from "zod";

/** The brain's entire action vocabulary — four verbs, nothing more (spec §5). */
export const Action = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("click"), ref: z.string(), reason: z.string().optional() }),
  z.object({ kind: z.literal("type"), ref: z.string(), text: z.string(), reason: z.string().optional() }),
  z.object({ kind: z.literal("done"), reason: z.string().optional() }),
  z.object({ kind: z.literal("give_up"), reason: z.string().optional() }),
]);
export type Action = z.infer<typeof Action>;
