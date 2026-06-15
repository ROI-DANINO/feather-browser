import type { FastifyRequest, FastifyReply } from "fastify";
import { ZodError } from "zod";

/** Maps a domain error `code` to an HTTP status. Unknown codes fall through to 500. */
const ERROR_STATUS: Record<string, number> = {
  SESSION_NOT_FOUND: 404,
  PROFILE_LOCKED: 409,
  SESSION_NOT_RUNNING: 409,
  PAGE_NOT_FOUND: 404,
  VALIDATION_ERROR: 400,
  ELEMENT_NOT_FOUND: 404,
  ELEMENT_NOT_ACTIONABLE: 409,
  WAIT_TIMEOUT: 408,
  CANNOT_CLOSE_LAST_TAB: 409,
  REF_EXPIRED: 409,
  DANGEROUS_DISABLED: 403,
  GRANT_REQUIRED: 403,
  HUMAN_IN_CONTROL: 409,
  IDENTITY_NOT_FOUND: 404,
  IDENTITY_ALREADY_EXISTS: 409,
};

export function errorStatus(code: string): number { return ERROR_STATUS[code] ?? 500; }
export function ok(requestId: string, data: unknown) { return { ok: true, requestId, data }; }
export function fail(requestId: string, code: string, message: string, details?: unknown) {
  return { ok: false, requestId, error: { code, message, ...(details !== undefined ? { details } : {}) } };
}
export function getRequestId(request: FastifyRequest): string { return (request as any).requestId ?? "unknown"; }

export async function handleRouteError(err: unknown, request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const requestId = getRequestId(request);
  if (err instanceof ZodError) {
    await reply.status(400).send(fail(requestId, "VALIDATION_ERROR", "Request body validation failed.", err.errors));
    return;
  }
  const code: string = (err as any)?.code ?? "INTERNAL_ERROR";
  const message: string = (err as any)?.message ?? "An unexpected error occurred.";
  await reply.status(errorStatus(code)).send(fail(requestId, code, message));
}
