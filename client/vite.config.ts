import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      "/auth/github": "http://localhost:3001",
      "/auth/me": "http://localhost:3001",
      "/auth/logout": "http://localhost:3001",
      "/api": "http://localhost:3001",
    },
  },
});
