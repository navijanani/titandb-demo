import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Demo build: no API proxy. Everything is served as static files.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
});
