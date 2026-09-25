import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig(({ mode }) => {
  // Keep the proxy target in sync with the server's PORT from `.env`,
  // so changing one place is enough to avoid host port conflicts.
  const env = loadEnv(mode, process.cwd(), "");
  const serverPort = env.PORT || "3001";

  return {
    plugins: [react(), tailwindcss()],
    // Client build lands beside the server build (dist/server), which the
    // production server serves from dist/client.
    build: { outDir: "dist/client", emptyOutDir: true },
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
        "/api": `http://localhost:${serverPort}`,
        "/ws": { target: `ws://localhost:${serverPort}`, ws: true },
      },
    },
  };
});
