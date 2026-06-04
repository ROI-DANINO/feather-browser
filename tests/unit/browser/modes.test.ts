import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventEmitter } from "events";

vi.mock("child_process", () => ({ spawn: vi.fn() }));
vi.mock("playwright", () => ({
  chromium: {
    connectOverCDP: vi.fn(),
  },
}));

import { buildLaunchOptions, spawnAndConnect } from "../../../src/browser/modes";
import { spawn } from "child_process";
import { chromium } from "playwright";

describe("buildLaunchOptions", () => {
  it("chromium-new-headless sets channel chromium and headless true", () => {
    const opts = buildLaunchOptions("chromium-new-headless");
    expect(opts.channel).toBe("chromium");
    expect(opts.headless).toBe(true);
  });

  it("chromium-headless-shell does not set channel", () => {
    const opts = buildLaunchOptions("chromium-headless-shell");
    expect(opts.channel).toBeUndefined();
    expect(opts.headless).toBe(true);
  });

  it("applies proxy when provided", () => {
    const opts = buildLaunchOptions("chromium-new-headless", {
      server: "http://127.0.0.1:8080",
      username: "u",
      password: "p",
      bypass: "localhost",
    });
    expect(opts.proxy).toEqual({
      server: "http://127.0.0.1:8080",
      username: "u",
      password: "p",
      bypass: "localhost",
    });
  });

  it("applies viewport when provided", () => {
    const opts = buildLaunchOptions("chromium-new-headless", undefined, { width: 1280, height: 800 });
    expect(opts.viewport).toEqual({ width: 1280, height: 800 });
  });

  it("uses default viewport 1280x800 when not provided", () => {
    const opts = buildLaunchOptions("chromium-new-headless");
    expect(opts.viewport).toEqual({ width: 1280, height: 800 });
  });
});

describe("spawnAndConnect", () => {
  let mockStderr: EventEmitter;
  let mockProcess: any;
  let mockContext: any;
  let mockBrowser: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockStderr = new EventEmitter();
    mockProcess = Object.assign(new EventEmitter(), {
      stderr: mockStderr,
      kill: vi.fn(),
    });
    mockContext = {};
    mockBrowser = { contexts: vi.fn().mockReturnValue([mockContext]) };
    vi.mocked(spawn).mockReturnValue(mockProcess as any);
    vi.mocked(chromium.connectOverCDP).mockResolvedValue(mockBrowser as any);
  });

  it("spawns with no automation flags and correct user-data-dir", async () => {
    setImmediate(() => {
      mockStderr.emit(
        "data",
        Buffer.from("DevTools listening on ws://127.0.0.1:9222/devtools/browser/abc\n")
      );
    });

    await spawnAndConnect({ profilePath: "/tmp/profile", executablePath: "/usr/bin/chrome" });

    const [, spawnArgs] = vi.mocked(spawn).mock.calls[0];
    expect(spawnArgs).toContain("--remote-debugging-port=0");
    expect(spawnArgs).toContain("--user-data-dir=/tmp/profile");
    expect(spawnArgs).toContain("--ozone-platform=wayland");
    expect(spawnArgs).not.toContain("--enable-automation");
    expect(spawnArgs).not.toContain("--headless");
  });

  it("passes the CDP websocket URL from stderr to connectOverCDP", async () => {
    const wsEndpoint = "ws://127.0.0.1:9222/devtools/browser/abc";
    setImmediate(() => {
      mockStderr.emit("data", Buffer.from(`DevTools listening on ${wsEndpoint}\n`));
    });

    await spawnAndConnect({ profilePath: "/tmp/profile", executablePath: "/usr/bin/chrome" });

    expect(chromium.connectOverCDP).toHaveBeenCalledWith(wsEndpoint);
  });

  it("returns the first browser context and the child process", async () => {
    setImmediate(() => {
      mockStderr.emit(
        "data",
        Buffer.from("DevTools listening on ws://127.0.0.1:9222/devtools/browser/abc\n")
      );
    });

    const result = await spawnAndConnect({ profilePath: "/tmp/profile", executablePath: "/usr/bin/chrome" });

    expect(result.context).toBe(mockContext);
    expect(result.childProcess).toBe(mockProcess);
  });

  it("rejects and kills the process when CDP message does not appear within 10s", async () => {
    vi.useFakeTimers();
    try {
      const promise = spawnAndConnect({ profilePath: "/tmp/profile", executablePath: "/usr/bin/chrome" });
      // Attach a no-op catch immediately so Node never sees an unhandled rejection
      // while fake timers are advancing; the real assertion below still checks the error.
      promise.catch(() => {});
      await vi.advanceTimersByTimeAsync(10_001);
      await expect(promise).rejects.toThrow("did not expose CDP");
      expect(mockProcess.kill).toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});
