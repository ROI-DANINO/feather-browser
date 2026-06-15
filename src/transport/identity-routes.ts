import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import type { IdentityManager } from "../identity/manager";
import { toIdentityView } from "../identity/types";
import { ok, getRequestId, handleRouteError } from "./http-helpers";

type PreHandler = (request: FastifyRequest, reply: FastifyReply) => Promise<void> | void;

const CreateIdentitySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  sites: z.array(z.string()).optional(),
  defaultWorkspaceId: z.string().optional(),
  defaultProfileId: z.string().optional(),
  stealthPolicy: z.object({ v: z.number() }).passthrough().optional(),
  mfaPolicy: z.object({ v: z.number() }).passthrough().optional(),
  vaultRef: z.string().optional(),
});

/**
 * Identity Model routes (Phase 5a). All token-authenticated. Responses use `toIdentityView`, which
 * strips `vaultRef` (council S5 — the secret locator never leaves the box; presence is signalled via
 * `hasVaultRef`). Warm status flips only via the explicit `/mark-warm` route (council S2).
 */
export function registerIdentityRoutes(
  app: FastifyInstance,
  identities: IdentityManager,
  tokenAuth: PreHandler,
): void {
  app.post("/v1/identities", { preHandler: [tokenAuth] }, async (request, reply) => {
    const requestId = getRequestId(request);
    try {
      const input = CreateIdentitySchema.parse(request.body);
      const record = await identities.create(input);
      await reply.status(200).send(ok(requestId, toIdentityView(record)));
    } catch (err) { await handleRouteError(err, request, reply); }
  });

  app.get("/v1/identities", { preHandler: [tokenAuth] }, async (request, reply) => {
    const requestId = getRequestId(request);
    try {
      const records = await identities.list();
      await reply.status(200).send(ok(requestId, records.map(toIdentityView)));
    } catch (err) { await handleRouteError(err, request, reply); }
  });

  app.get("/v1/identities/:id", { preHandler: [tokenAuth] }, async (request, reply) => {
    const requestId = getRequestId(request);
    try {
      const { id } = request.params as { id: string };
      const record = await identities.get(id);
      await reply.status(200).send(ok(requestId, toIdentityView(record)));
    } catch (err) { await handleRouteError(err, request, reply); }
  });

  app.delete("/v1/identities/:id", { preHandler: [tokenAuth] }, async (request, reply) => {
    const requestId = getRequestId(request);
    try {
      const { id } = request.params as { id: string };
      await identities.delete(id);
      await reply.status(200).send(ok(requestId, { deleted: true }));
    } catch (err) { await handleRouteError(err, request, reply); }
  });

  app.post("/v1/identities/:id/warm", { preHandler: [tokenAuth] }, async (request, reply) => {
    const requestId = getRequestId(request);
    try {
      const { id } = request.params as { id: string };
      const result = await identities.warm(id);
      await reply.status(200).send(ok(requestId, result));
    } catch (err) { await handleRouteError(err, request, reply); }
  });

  // Explicit warm-status confirmation (council S2): warm is NEVER inferred from a session close.
  app.post("/v1/identities/:id/mark-warm", { preHandler: [tokenAuth] }, async (request, reply) => {
    const requestId = getRequestId(request);
    try {
      const { id } = request.params as { id: string };
      const record = await identities.markWarm(id);
      await reply.status(200).send(ok(requestId, toIdentityView(record)));
    } catch (err) { await handleRouteError(err, request, reply); }
  });
}
