/// <reference types="vitest" />
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const DEFAULT_PORT = 5173;
const DEFAULT_API_BASE_URL = "http://localhost:8000";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const port = Number(env.VITE_PORT) || DEFAULT_PORT;
  const allowedHosts = env.VITE_ALLOWED_HOSTS
    ? env.VITE_ALLOWED_HOSTS.split(",")
        .map((h) => h.trim())
        .filter(Boolean)
    : [];
  return {
    plugins: [react()],
    server: {
      port,
      host: true,
      allowedHosts,
      proxy: {
        "/api": {
          target: env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL,
          changeOrigin: true,
        },
      },
    },
    preview: { port },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: ["./src/test/setup.ts"],
      css: false,
    },
  };
});
