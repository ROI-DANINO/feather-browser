import * as fs from "fs";
import * as path from "path";

export interface FileHit {
  file: string;
  count: number;
  contextSnippet: string;
}

export interface LeakScanReport {
  cleanTierHits: FileHit[];
  captureFindings: string[];
  unscannable: string[];
}

const CAPTURE_TIER = [/(^|\/)trace\.zip$/, /(^|\/)screenshots\//, /\.(png|jpe?g)$/i];

function isCaptureTier(filePath: string): boolean {
  return CAPTURE_TIER.some((re) => re.test(filePath));
}

function walk(dir: string): string[] {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

export function scanForSecret(secret: string, roots: string[]): LeakScanReport {
  const report: LeakScanReport = { cleanTierHits: [], captureFindings: [], unscannable: [] };

  for (const root of roots) {
    for (const file of walk(root)) {
      if (isCaptureTier(file)) {
        report.captureFindings.push(file);
        continue;
      }

      let content: string;
      try {
        content = fs.readFileSync(file, "utf8");
      } catch {
        report.unscannable.push(file);
        continue;
      }

      const idx = content.indexOf(secret);
      if (idx !== -1) {
        const count = content.split(secret).length - 1;
        const start = Math.max(0, idx - 40);
        const end = Math.min(content.length, idx + secret.length + 40);
        report.cleanTierHits.push({
          file,
          count,
          contextSnippet: content.slice(start, end).replace(/\s+/g, " "),
        });
      }
    }
  }

  return report;
}

export function assertNoSecretLeak(secret: string, roots: string[]): LeakScanReport {
  const report = scanForSecret(secret, roots);

  if (report.captureFindings.length > 0) {
    console.warn(
      "[leak-scan] capture-tier artifacts present (known leak surfaces; mitigate by policy, not detection):\n  " +
        report.captureFindings.join("\n  "),
    );
  }

  if (report.unscannable.length > 0) {
    console.warn("[leak-scan] unscannable files (not silently skipped):\n  " + report.unscannable.join("\n  "));
  }

  if (report.cleanTierHits.length > 0) {
    const lines = report.cleanTierHits
      .map((hit) => `  - ${hit.file} (${hit.count}x): ...${hit.contextSnippet}...`)
      .join("\n");
    throw new Error(`SECRET LEAK: canary found in ${report.cleanTierHits.length} clean-tier surface(s):\n${lines}`);
  }

  return report;
}
