import { describe, it, expect } from "vitest";
import { promptPage, confirmedPage, expiredPage } from "../../../src/transport/resume-page";

describe("resume-page templates", () => {
  it("promptPage shows the reason and a POST form with a Resume button", () => {
    const html = promptPage("Solve the CAPTCHA");
    expect(html).toContain("Solve the CAPTCHA");
    expect(html).toContain('method="POST"');
    expect(html).toMatch(/Resume/);
  });

  it("promptPage HTML-escapes the reason (no injection)", () => {
    const html = promptPage('<script>alert(1)</script>');
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("confirmedPage and expiredPage carry their distinct messages", () => {
    expect(confirmedPage()).toMatch(/Resumed/);
    expect(expiredPage()).toMatch(/already resumed|expired/i);
  });
});
