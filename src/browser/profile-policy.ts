import * as fs from "fs";
import * as path from "path";

/**
 * Disable Chromium's built-in password manager on a profile by merging the relevant prefs into
 * <profilePath>/Default/Preferences. Keeps raw creds out of the shared cookie jar (they belong in a
 * dedicated vault, separate from the context agents piggyback on). Merge-not-clobber so it never
 * destroys warmed session state. Must run while Chromium for this profile is NOT running.
 */
export async function disablePasswordManager(profilePath: string): Promise<void> {
  const defaultDir = path.join(profilePath, "Default");
  const prefsPath = path.join(defaultDir, "Preferences");
  await fs.promises.mkdir(defaultDir, { recursive: true });
  let prefs: Record<string, unknown> = {};
  try {
    prefs = JSON.parse(await fs.promises.readFile(prefsPath, "utf8")) as Record<string, unknown>;
  } catch {
    /* no existing prefs — start fresh */
  }
  prefs.credentials_enable_service = false;
  const profile = (prefs.profile as Record<string, unknown> | undefined) ?? {};
  profile.password_manager_enabled = false;
  prefs.profile = profile;
  await fs.promises.writeFile(prefsPath, JSON.stringify(prefs));
}
