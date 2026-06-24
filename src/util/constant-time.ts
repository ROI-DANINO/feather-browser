import { timingSafeEqual } from "crypto";

/**
 * Constant-time string equality for bearer secrets / CSRF nonces. Non-strings (undefined, null, arrays,
 * numbers) and length mismatches return false — the early length check leaks nothing meaningful, since
 * these secrets are fixed-width random values whose length is not itself secret, and it avoids
 * `timingSafeEqual` throwing on unequal-length buffers.
 */
export function constantTimeEqual(a: unknown, b: unknown): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}
