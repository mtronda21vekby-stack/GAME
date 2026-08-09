import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

const threeRuntimeFacade = fileURLToPath(new URL("./src/experience/vendor/three-runtime.ts", import.meta.url));

export default defineConfig({
  plugins: [react()],
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
      output: {
        manualChunks(id) {
          if (id.includes("/three/examples/jsm/")) {
            return "nexus-gltf-loader";
          }
          if (id.includes("/three/src/renderers/") || id.includes("/three/src/materials/ShaderMaterial.js") || id.includes("/three/src/extras/PMREMGenerator.js")) {
            return "nexus-three-renderer";
          }
          if (
            id.includes("/three/src/animation/") ||
            id.includes("/three/src/loaders/") ||
            /\/three\/src\/objects\/(?:Bone|InstancedMesh|Line|LineLoop|LineSegments|Skeleton|SkinnedMesh)\.js$/u.test(id) ||
            id.includes("/three/src/lights/SpotLight.js") ||
            id.includes("/three/src/materials/LineBasicMaterial.js") ||
            /\/three\/src\/textures\/(?:CompressedArrayTexture|CompressedCubeTexture)\.js$/u.test(id)
          ) {
            return "nexus-three-gltf-support";
          }
          if (id.includes("/node_modules/.pnpm/three@") || id.includes("/node_modules/three/")) {
            return "nexus-three";
          }
        },
      },
    },
  }
});
