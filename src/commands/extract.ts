import type { CommandHandler, CommandContext } from "./handler";
import type { ExtractRecipe } from "../sessions/types";

interface IManager {
  get(sessionId: string): {
    getPage(pageId?: string): { pageId: string; page: import("playwright").Page };
  };
}

export interface ExtractInput {
  sessionId: string;
  pageId?: string;
  recipe: ExtractRecipe;
}

export type ExtractOutput = Record<string, string | null>;

export class ExtractHandler implements CommandHandler<ExtractInput, ExtractOutput> {
  constructor(private readonly manager: IManager) {}

  async execute(input: ExtractInput, _ctx: CommandContext): Promise<ExtractOutput> {
    const { sessionId, pageId, recipe } = input;
    const session = this.manager.get(sessionId);
    const { page } = session.getPage(pageId);
    const textLimit = recipe.limits?.textChars;
    const result: ExtractOutput = {};

    for (const [fieldName, field] of Object.entries(recipe.fields)) {
      try {
        const locator = page.locator(field.selector).first();
        if (field.type === "text") {
          const raw = await locator.textContent();
          if (raw === null) {
            result[fieldName] = null;
          } else {
            const trimmed = raw.trim();
            result[fieldName] = textLimit !== undefined ? trimmed.slice(0, textLimit) : trimmed;
          }
        } else {
          const value = await locator.getAttribute(field.attribute!);
          result[fieldName] = value ?? null;
        }
      } catch {
        result[fieldName] = null;
      }
    }
    return result;
  }
}
