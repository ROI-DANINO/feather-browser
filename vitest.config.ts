import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 10000,
    include: ["tests/unit/**/*.test.ts", "tower/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/capability/**", "src/identity/**", "src/mfa/**", "src/transport/**"],
      // resolve-banner.ts drives Playwright (banner inject + CDP tab open) and is covered by
      // tests/integration/mfa-resolve-banner.integration.test.ts, which the unit-coverage run doesn't
      // execute — so it's excluded from the unit floor rather than dragging it down dishonestly.
      exclude: ["src/mfa/resolve-banner.ts"],
      reporter: ["text", "html"],
      // Loose per-area floors, set a few points below current UNIT coverage so they catch a real
      // regression without being fragile. transport's routes are exercised by the INTEGRATION suite,
      // so its UNIT floor is intentionally low — the unit run only touches its pure middleware/helpers.
      // Only active with --coverage (see `npm run test:coverage`); plain `npm test` stays fast.
      thresholds: {
        "src/capability/**": { statements: 85, branches: 80, functions: 85, lines: 88 },
        "src/identity/**": { statements: 82, branches: 72, functions: 82, lines: 85 },
        "src/mfa/**": { statements: 85, branches: 75, functions: 85, lines: 88 },
        "src/transport/**": { statements: 22, branches: 33, functions: 30, lines: 22 },
      },
    },
  },
});
