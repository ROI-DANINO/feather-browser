import { describe, it, expect, vi } from "vitest";
import { ensureHumanAuth, IFeatherApi } from "../../../scripts/demo/continuity";

describe("ensureHumanAuth", () => {
  it("returns immediately when already authenticated", async () => {
    const api: IFeatherApi = {
      request: vi.fn()
        .mockResolvedValueOnce({}) // navigate to targetUrl
        .mockResolvedValueOnce({}), // wait — signal found immediately
    };

    await expect(
      ensureHumanAuth(api, "sid", {
        targetUrl: "https://gmail.com",
        checkTargets: [{ by: "css", selector: ".compose" }],
      }),
    ).resolves.toBeUndefined();

    expect(api.request).toHaveBeenCalledTimes(2);
    expect(api.request).toHaveBeenNthCalledWith(
      1, "POST", "/v1/sessions/sid/navigate", expect.objectContaining({ url: "https://gmail.com" }),
    );
    expect(api.request).toHaveBeenNthCalledWith(
      2, "POST", "/v1/sessions/sid/wait", expect.objectContaining({ until: "visible", timeoutMs: 3000 }),
    );
  });

  it("polls current page until login is detected", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const api: IFeatherApi = {
      request: vi.fn()
        .mockResolvedValueOnce({})                   // navigate — initial
        .mockRejectedValueOnce(new Error("timeout")) // fast probe — not logged in
        .mockResolvedValueOnce({}),                  // poll probe — authenticated
    };

    await expect(
      ensureHumanAuth(api, "sid", {
        targetUrl: "https://gmail.com",
        checkTargets: [{ by: "css", selector: ".compose" }],
        pollIntervalMs: 0,
      }),
    ).resolves.toBeUndefined();

    expect(api.request).toHaveBeenCalledTimes(3);
    // Polling probes the current page instead of re-navigating, so it does not
    // interrupt OAuth/login redirects while the human is completing auth.
    expect(api.request).toHaveBeenNthCalledWith(
      3, "POST", "/v1/sessions/sid/wait", expect.objectContaining({ until: "visible", timeoutMs: 0 }),
    );

    logSpy.mockRestore();
  });

  it("throws after timeout when login is never detected", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const api: IFeatherApi = {
      request: vi.fn(async (_method: string, route: string) => {
        if (route.endsWith("/navigate")) return {};
        throw new Error("element not found");
      }),
    };

    await expect(
      ensureHumanAuth(api, "sid", {
        targetUrl: "https://gmail.com",
        checkTargets: [{ by: "css", selector: ".compose" }],
        pollIntervalMs: 0,
        timeoutMs: 50,
      }),
    ).rejects.toThrow("Authentication timed out");

    logSpy.mockRestore();
  });
});