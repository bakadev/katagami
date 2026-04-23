import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    // NOTE: `@server/*` is intentionally omitted here.
    // tsconfig.json declares it for editor/type-check convenience, but
    // server code must never be pulled into the client bundle. A missing
    // resolver is the cheap safety net that turns accidental imports
    // into Vite build errors.
    alias: {
      "~": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3001",
      "/ws": { target: "ws://localhost:3001", ws: true },
    },
  },
});
