import { errors } from "playwright";
import type { Locator } from "playwright";

export class ElementNotFoundError extends Error {
  readonly code = "ELEMENT_NOT_FOUND";
  constructor(message: string) { super(message); this.name = "ElementNotFoundError"; }
}

export class ElementNotActionableError extends Error {
  readonly code = "ELEMENT_NOT_ACTIONABLE";
  constructor(message: string) { super(message); this.name = "ElementNotActionableError"; }
}

export class WaitTimeoutError extends Error {
  readonly code = "WAIT_TIMEOUT";
  constructor(message: string) { super(message); this.name = "WaitTimeoutError"; }
}

export class RefExpiredError extends Error {
  readonly code = "REF_EXPIRED";
  constructor(message: string) { super(message); this.name = "RefExpiredError"; }
}

/** Run a Playwright action; convert TimeoutError into a precise coded error. */
export async function withActionErrors<T>(loc: Locator, what: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof errors.TimeoutError) {
      const count = await loc.count().catch(() => 0);
      if (count === 0) {
        throw new ElementNotFoundError(`No element matched the target for "${what}".`);
      }
      throw new ElementNotActionableError(
        `Target for "${what}" matched ${count} element(s) but the action timed out (covered, disabled, or off-screen?).`,
      );
    }
    throw err;
  }
}
