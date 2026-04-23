import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    pool: "forks",
    singleFork: true,
  },
  resolve: {
    alias: {
      "~": "/src",
      "@server": "/server",
      "@shared": "/shared",
    },
  },
});
