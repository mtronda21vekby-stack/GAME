import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/lobby/",
  plugins: [react()],
  build: {
    outDir: "dist",
    target: "es2022"
  }
});
