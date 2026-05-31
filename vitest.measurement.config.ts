import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 300000,
    include: ["tests/measurement/**/*.measurement.test.ts"],
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
  },
});
