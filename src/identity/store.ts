import * as fs from "fs";
import * as path from "path";
import { IdentityNotFoundError, type IdentityRecord } from "./types";

/**
 * Thin FS layer for identity records — one JSON file per identity under `identitiesDir`. No DB.
 * Writes are atomic (tmp + rename) so a reader never sees a half-written record, and files/dir are
 * created owner-only (0600/0700) since a record describes a warmed credential profile (council S5).
 * Read-modify-write races are guarded one level up, in `IdentityManager` (council S4).
 */
export class IdentityStore {
  constructor(private readonly identitiesDir: string) {}

  private file(id: string): string {
    return path.join(this.identitiesDir, `${id}.json`);
  }

  async save(record: IdentityRecord): Promise<void> {
    await fs.promises.mkdir(this.identitiesDir, { recursive: true, mode: 0o700 });
    const target = this.file(record.id);
    const tmp = `${target}.tmp`;
    await fs.promises.writeFile(tmp, JSON.stringify(record, null, 2), { encoding: "utf8", mode: 0o600 });
    await fs.promises.rename(tmp, target);
  }

  async load(id: string): Promise<IdentityRecord> {
    try {
      const raw = await fs.promises.readFile(this.file(id), "utf8");
      return JSON.parse(raw) as IdentityRecord;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") throw new IdentityNotFoundError(id);
      throw err;
    }
  }

  async list(): Promise<IdentityRecord[]> {
    let entries: string[];
    try {
      entries = await fs.promises.readdir(this.identitiesDir);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw err;
    }
    const records: IdentityRecord[] = [];
    for (const name of entries) {
      if (!name.endsWith(".json")) continue;
      try {
        const raw = await fs.promises.readFile(path.join(this.identitiesDir, name), "utf8");
        records.push(JSON.parse(raw) as IdentityRecord);
      } catch {
        // Corrupted / partially-written file — skip it rather than fail the whole listing.
        continue;
      }
    }
    return records;
  }

  async delete(id: string): Promise<void> {
    try {
      await fs.promises.unlink(this.file(id));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") throw new IdentityNotFoundError(id);
      throw err;
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      await fs.promises.access(this.file(id));
      return true;
    } catch {
      return false;
    }
  }
}
