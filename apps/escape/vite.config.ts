import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const threePath = decodeURIComponent(new URL("../site/node_modules/three", import.meta.url).pathname);

export default defineConfig({
  plugins: [react()],
  base: "/games/breakout/",
  resolve: {
    alias: {
      three: threePath,
    },
  },
  build: {
    target: "es2022",
    sourcemap: true,
  },
});
