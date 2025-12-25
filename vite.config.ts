import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // GitHub Pages serves the app under /<repo>/
  const isGhPages = process.env.GITHUB_ACTIONS === "true";
  return {
    plugins: [react()],
    base: isGhPages ? "/Lab-Tools/" : "/",
    server: { port: 5173 },
    build: {
      sourcemap: mode !== "production",
    },
  };
});
