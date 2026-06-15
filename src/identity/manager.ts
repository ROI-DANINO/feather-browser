import type { FeatherPaths } from "../fs-layout";
import type { ISessionManager } from "../sessions/manager";
import type { FeatherLogger } from "../logs/logger";
import { EVENTS } from "../logs/events";
import { disablePasswordManager } from "../browser/profile-policy";
import type { IdentityStore } from "./store";
import {
  IdentityAlreadyExistsError,
  IdentityValidationError,
  type CreateIdentityInput,
  type IdentityRecord,
} from "./types";

const ID_SLUG = /^[a-z0-9][a-z0-9-]*$/;

/**
 * Business logic for identities: create / get / list / delete / warm / markWarm.
 *
 * Council security re-sequencing baked in:
 * - S2: warm status is set ONLY via an explicit, awaited `markWarm()` — there is no
 *   warm-on-session-close bus listener (a close does not mean a successful login).
 * - S4: read-modify-write paths run under a per-identity async mutex and bump a version counter,
 *   so two concurrent updates can't silently clobber each other.
 * - S1: identity / workspace / profile ids are stored separably (each defaults to the id).
 * - S5: the password manager is disabled on the profile at create; `vaultRef` is stored but ignored.
 */
export class IdentityManager {
  private readonly locks = new Map<string, Promise<unknown>>();

  constructor(
    private readonly store: IdentityStore,
    private readonly paths: FeatherPaths,
    private readonly sessions: ISessionManager,
    private readonly logger: FeatherLogger,
  ) {}

  /** Serialize read-modify-write work per identity id (council S4). */
  private withLock<T>(id: string, fn: () => Promise<T>): Promise<T> {
    const prev = this.locks.get(id) ?? Promise.resolve();
    const run = prev.then(fn, fn);
    this.locks.set(id, run.then(() => undefined, () => undefined));
    return run;
  }

  async create(input: CreateIdentityInput): Promise<IdentityRecord> {
    if (!ID_SLUG.test(input.id)) {
      throw new IdentityValidationError(
        `Invalid identity id '${input.id}': must match ${ID_SLUG} (lowercase slug).`,
      );
    }
    if (!input.name || input.name.trim() === "") {
      throw new IdentityValidationError("Identity name must be a non-empty string.");
    }
    if (await this.store.exists(input.id)) {
      throw new IdentityAlreadyExistsError(input.id);
    }

    const now = new Date().toISOString();
    const record: IdentityRecord = {
      id: input.id,
      name: input.name,
      sites: input.sites ?? [],
      defaultWorkspaceId: input.defaultWorkspaceId ?? input.id,
      defaultProfileId: input.defaultProfileId ?? input.id,
      stealthPolicy: input.stealthPolicy ?? { v: 1, mode: "secure" },
      mfaPolicy: input.mfaPolicy ?? { v: 1 },
      ...(input.vaultRef !== undefined ? { vaultRef: input.vaultRef } : {}),
      warmStatus: "cold",
      createdAt: now,
      updatedAt: now,
      version: 1,
    };

    // Keep raw passwords out of the warm cookie jar from day one (council S5).
    await disablePasswordManager(this.paths.profileDir(record.defaultProfileId));
    await this.store.save(record);

    await this.logger.log({
      ts: now,
      level: "info",
      event: EVENTS.IDENTITY_CREATED,
      data: { identityId: record.id },
    });
    return record;
  }

  async get(id: string): Promise<IdentityRecord> {
    return this.store.load(id);
  }

  async list(): Promise<IdentityRecord[]> {
    return this.store.list();
  }

  async delete(id: string): Promise<void> {
    await this.store.delete(id);
  }

  /**
   * Launch a headed, persistent session on the identity's profile so a human can log in once.
   * Warm status is NOT inferred from this — the caller marks warm explicitly via `markWarm()`.
   */
  async warm(id: string): Promise<{ sessionId: string }> {
    const identity = await this.get(id);
    const session = await this.sessions.launch({
      workspaceId: identity.defaultWorkspaceId,
      profile: { kind: "persistent" },
      browserMode: "chromium-headed-cdp",
    });
    return { sessionId: session.sessionId };
  }

  /** Explicit, awaited warm-status transition (council S2). Serialized + versioned (council S4). */
  async markWarm(id: string): Promise<IdentityRecord> {
    return this.withLock(id, async () => {
      const record = await this.store.load(id);
      const now = new Date().toISOString();
      record.warmStatus = "warm";
      record.lastWarmAt = now;
      record.updatedAt = now;
      record.version += 1;
      await this.store.save(record);
      await this.logger.log({
        ts: now,
        level: "info",
        event: EVENTS.IDENTITY_WARMED,
        data: { identityId: id },
      });
      return record;
    });
  }
}
