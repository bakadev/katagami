import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    pool: "forks",
    maxWorkers: 1,
  },
  resolve: {
    alias: {
      "~": "/src",
      "@server": "/server",
      "@shared": "/shared",
    },
  },
});
