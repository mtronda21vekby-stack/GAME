import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const threeRuntimeFacade = fileURLToPath(new URL("./src/experience/vendor/three-runtime.ts", import.meta.url));
const siteBuild = (() => {
  if (process.env.VITE_APP_COMMIT || process.env.GITHUB_SHA) return process.env.VITE_APP_COMMIT || process.env.GITHUB_SHA!;
  try {
    const sha = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
    const dirty = execFileSync("git", ["status", "--porcelain", "--untracked-files=no"], { encoding: "utf8" }).trim();
    return sha + (dirty ? "-local" : "");
  } catch { return "local"; }
})();

export default defineConfig({
  plugins: [react(), {
    name: "blackcrown-build-identity",
    transformIndexHtml: () => [{ tag: "meta", attrs: { name: "bc-site-build", content: siteBuild }, injectTo: "head" }],
  }],
  define: { "import.meta.env.VITE_APP_COMMIT": JSON.stringify(siteBuild) },
  resolve: {
    alias: [{ find: /^three$/, replacement: threeRuntimeFacade }],
  },
  build: {
    outDir: "dist",
    target: "es2022",
    minify: "terser",
    terserOptions: {
      module: true,
      toplevel: true,
      compress: { passes: 3, pure_getters: true, unsafe_arrows: true, unsafe_math: true },
      mangle: { toplevel: true },
      format: { comments: false },
    },
    rollupOptions: {
      input: { main: fileURLToPath(new URL("./index.html", import.meta.url)), games: fileURLToPath(new URL("./games/index.html", import.meta.url)) },
      output: {
        manualChunks(id) {
          if (id.includes("/three/examples/jsm/")) {
            return "nexus-gltf-loader";
          }
          if (id.includes("/three/src/renderers/") || /\/three\/src\/materials\/(?:Raw)?ShaderMaterial\.js$/.test(id) || id.includes("/three/src/extras/PMREMGenerator.js")) {
            return "nexus-three-renderer";
          }
          if (id.includes("/node_modules/.pnpm/three@") || id.includes("/node_modules/three/")) {
            return "nexus-three";
          }
        },
      },
    },
  }
});
