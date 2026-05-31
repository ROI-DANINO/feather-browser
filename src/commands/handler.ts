import type { CommandContext } from "../sessions/types";
export type { CommandContext };
export interface CommandHandler<TIn, TOut> {
  execute(input: TIn, ctx: CommandContext): Promise<TOut>;
}
