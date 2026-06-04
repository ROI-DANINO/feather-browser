// tests/unit/logs/redact.test.ts
import { describe, it, expect } from "vitest";
import { redactProxy, redactUrl } from "../../../src/logs/redact";
import type { ProxyConfig } from "../../../src/sessions/types";

describe("redactProxy", () => {
  it("returns sanitized summary with hasCredentials true when credentials present", () => {
    const proxy: ProxyConfig = {
      server: "http://127.0.0.1:8080",
      username: "user",
      password: "secret",
      bypass: "localhost",
    };
    const result = redactProxy(proxy);
    expect(result.server).toBe("http://127.0.0.1:8080");
    expect(result.hasCredentials).toBe(true);
    expect(result.bypass).toBe("localhost");
    expect(result).not.toHaveProperty("username");
    expect(result).not.toHaveProperty("password");
  });

  it("returns hasCredentials false when no credentials", () => {
    const proxy: ProxyConfig = { server: "http://proxy.example.com:3128" };
    const result = redactProxy(proxy);
    expect(result.hasCredentials).toBe(false);
  });

  it("omits bypass when not set", () => {
    const proxy: ProxyConfig = { server: "http://proxy.example.com:3128" };
    const result = redactProxy(proxy);
    expect(result.bypass).toBeUndefined();
  });
});

describe("redactUrl", () => {
  it("strips username and password from URL", () => {
    expect(redactUrl("http://user:secret@proxy.example.com:8080"))
      .toBe("http://proxy.example.com:8080");
  });

  it("returns unchanged URL when no credentials", () => {
    expect(redactUrl("http://proxy.example.com:8080"))
      .toBe("http://proxy.example.com:8080");
  });

  it("returns original string if not a valid URL", () => {
    expect(redactUrl("not-a-url")).toBe("not-a-url");
  });

  it("strips the query string", () => {
    expect(redactUrl("http://site.example.com/login?token=SECRET"))
      .toBe("http://site.example.com/login");
  });

  it("strips the fragment", () => {
    expect(redactUrl("http://site.example.com/cb#access_token=SECRET"))
      .toBe("http://site.example.com/cb");
  });

  it("strips credentials and query together", () => {
    expect(redactUrl("http://user:pw@site.example.com/p?k=SECRET"))
      .toBe("http://site.example.com/p");
  });
});
