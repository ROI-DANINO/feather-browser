import { describe, it, expect, beforeEach } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import { registerIdentityRoutes } from "../../../src/transport/identity-routes";
import {
  IdentityAlreadyExistsError,
  IdentityNotFoundError,
  type IdentityRecord,
} from "../../../src/identity/types";

function record(id: string, vaultRef?: string): IdentityRecord {
  const now = "2026-06-15T00:00:00.000Z";
  return {
    id,
    name: `Name ${id}`,
    sites: [],
    defaultWorkspaceId: id,
    defaultProfileId: id,
    stealthPolicy: { v: 1, mode: "secure" },
    mfaPolicy: { v: 1 },
    ...(vaultRef !== undefined ? { vaultRef } : {}),
    warmStatus: "cold",
    createdAt: now,
    updatedAt: now,
    version: 1,
  };
}

// Minimal stub standing in for IdentityManager.
const fakeManager = {
  create: async (input: { id: string }) => {
    if (input.id === "dup") throw new IdentityAlreadyExistsError("dup");
    return record(input.id, "keyring://secret");
  },
  get: async (id: string) => {
    if (id === "ghost") throw new IdentityNotFoundError("ghost");
    return record(id, "keyring://secret");
  },
  list: async () => [record("a"), record("b")],
  delete: async (id: string) => {
    if (id === "ghost") throw new IdentityNotFoundError("ghost");
  },
  warm: async (id: string) => {
    if (id === "ghost") throw new IdentityNotFoundError("ghost");
    return { sessionId: "ses_warm" };
  },
  markWarm: async (id: string) => {
    if (id === "ghost") throw new IdentityNotFoundError("ghost");
    return { ...record(id), warmStatus: "warm" as const };
  },
};

async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify();
  // Pass-through auth (real token auth is applied by registerRoutes in production).
  registerIdentityRoutes(app, fakeManager as never, async () => {});
  await app.ready();
  return app;
}

describe("identity routes", () => {
  let app: FastifyInstance;
  beforeEach(async () => {
    app = await buildApp();
  });

  it("POST /v1/identities returns the created identity with vaultRef redacted (S5)", async () => {
    const res = await app.inject({ method: "POST", url: "/v1/identities", payload: { id: "roi", name: "Roi" } });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.ok).toBe(true);
    expect(body.data.id).toBe("roi");
    expect(body.data.vaultRef).toBeUndefined();   // never leaks
    expect(body.data.hasVaultRef).toBe(true);      // but presence is signalled
  });

  it("POST /v1/identities → 409 on duplicate", async () => {
    const res = await app.inject({ method: "POST", url: "/v1/identities", payload: { id: "dup", name: "Dup" } });
    expect(res.statusCode).toBe(409);
    expect(res.json().error.code).toBe("IDENTITY_ALREADY_EXISTS");
  });

  it("POST /v1/identities → 400 on a malformed body", async () => {
    const res = await app.inject({ method: "POST", url: "/v1/identities", payload: { name: "no id" } });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe("VALIDATION_ERROR");
  });

  it("GET /v1/identities lists identities (redacted)", async () => {
    const res = await app.inject({ method: "GET", url: "/v1/identities" });
    expect(res.statusCode).toBe(200);
    const ids = res.json().data.map((r: { id: string }) => r.id);
    expect(ids).toEqual(["a", "b"]);
    expect(res.json().data[0].vaultRef).toBeUndefined();
  });

  it("GET /v1/identities/:id → 200 then 404 for unknown", async () => {
    expect((await app.inject({ method: "GET", url: "/v1/identities/roi" })).statusCode).toBe(200);
    const miss = await app.inject({ method: "GET", url: "/v1/identities/ghost" });
    expect(miss.statusCode).toBe(404);
    expect(miss.json().error.code).toBe("IDENTITY_NOT_FOUND");
  });

  it("DELETE /v1/identities/:id → 200 then 404 for unknown", async () => {
    const ok = await app.inject({ method: "DELETE", url: "/v1/identities/roi" });
    expect(ok.statusCode).toBe(200);
    expect(ok.json().data).toEqual({ deleted: true });
    expect((await app.inject({ method: "DELETE", url: "/v1/identities/ghost" })).statusCode).toBe(404);
  });

  it("POST /v1/identities/:id/warm → { sessionId }, 404 for unknown", async () => {
    const ok = await app.inject({ method: "POST", url: "/v1/identities/roi/warm" });
    expect(ok.statusCode).toBe(200);
    expect(ok.json().data).toEqual({ sessionId: "ses_warm" });
    expect((await app.inject({ method: "POST", url: "/v1/identities/ghost/warm" })).statusCode).toBe(404);
  });

  it("POST /v1/identities/:id/mark-warm flips status (redacted)", async () => {
    const res = await app.inject({ method: "POST", url: "/v1/identities/roi/mark-warm" });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.warmStatus).toBe("warm");
    expect(res.json().data.vaultRef).toBeUndefined();
  });
});
