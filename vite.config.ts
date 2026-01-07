/// <reference types="node" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import vike from "vike/plugin";
import path from "path";

export default defineConfig(({ mode }) => ({
  plugins: [
    react({
      // Only use React Compiler in production to avoid HMR issues
      babel:
        mode === "production"
          ? {
              plugins: [
                [
                  "babel-plugin-react-compiler",
                  {
                    target: "18",
                  },
                ],
              ],
            }
          : undefined,
    }),
    tailwindcss(),
    vike(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ["@jscad/modeling"],
    exclude: ["as-mesh"], // Exclude WASM modules from optimization
    esbuildOptions: {
      target: "esnext",
    },
  },
  ssr: {
    noExternal: [
      "three",
      "three-bvh-csg",
      "three-mesh-bvh",
      "three-stdlib",
      "@react-three/fiber",
      "@react-three/drei",
      "zustand",
      "detect-gpu",
    ],
  },
  worker: {
    format: "es", // Use ES modules for workers to support top-level await
  },
  build: {
    target: "esnext",
    commonjsOptions: {
      ignore: ["module", "worker_threads"],
      exclude: ["node_modules/as-mesh/**"],
    },
    rollupOptions: {
      external: ["module", "worker_threads"],
      output: {
        format: "es", // Use ES modules format to support top-level await
        inlineDynamicImports: false, // Don't inline for workers
      },
    },
  },
  server: {
    headers: {
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Opener-Policy": "same-origin",
    },
    hmr: {
      overlay: true,
      protocol: "ws",
      host: "localhost",
    },
    watch: {
      usePolling: false,
      // Ensure changes are detected
      ignored: ["!**/node_modules/**"],
    },
  },
  // Ensure .wasm files are served with correct MIME type
  assetsInclude: ["**/*.wasm"],
}));
