import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    target: "es2022",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("/node_modules/.pnpm/three@") || id.includes("/node_modules/three/")) {
            return "nexus-three";
          }
        },
      },
    },
  }
});
