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

  it("hands off to the human with the on-page banner, then resumes after login", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const api: IFeatherApi = {
      request: vi.fn()
        .mockResolvedValueOnce({})                   // navigate
        .mockRejectedValueOnce(new Error("timeout")) // fast probe — not logged in
        .mockResolvedValueOnce({})                   // await-human — human/signal resumed
        .mockResolvedValueOnce({}),                  // post-check probe — authenticated
    };

    await expect(
      ensureHumanAuth(api, "sid", {
        targetUrl: "https://gmail.com",
        checkTargets: [{ by: "css", selector: ".compose" }],
      }),
    ).resolves.toBeUndefined();

    expect(api.request).toHaveBeenCalledTimes(4);
    expect(api.request).toHaveBeenNthCalledWith(
      3, "POST", "/v1/sessions/sid/await-human",
      expect.objectContaining({
        banner: true,
        resumeOn: { target: { by: "css", selector: ".compose" }, until: "visible" },
      }),
    );
    expect(api.request).toHaveBeenNthCalledWith(
      4, "POST", "/v1/sessions/sid/wait", expect.objectContaining({ until: "visible", timeoutMs: 5000 }),
    );

    logSpy.mockRestore();
  });

  it("throws when resumed but login never completed", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const api: IFeatherApi = {
      request: vi.fn(async (_method: string, route: string) => {
        if (route.endsWith("/navigate")) return {};
        if (route.endsWith("/await-human")) return {};
        throw new Error("element not found"); // every probe fails
      }),
    };

    await expect(
      ensureHumanAuth(api, "sid", {
        targetUrl: "https://gmail.com",
        checkTargets: [{ by: "css", selector: ".compose" }],
        timeoutMs: 50,
      }),
    ).rejects.toThrow("not authenticated");

    logSpy.mockRestore();
  });
});
