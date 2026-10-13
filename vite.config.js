import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In dev, Vite serves the pages on :8080 and forwards /api to the Express server.
// In production, the Express server serves dist/ and the API on one port.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 8080,
    proxy: { "/api": `http://localhost:${process.env.PORT || 7002}` },
  },
});
