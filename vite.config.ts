import { defineConfig } from "vite";
import { miaodaDevPlugin } from "miaoda-sc-plugin";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    miaodaDevPlugin(),
    svgr({
      svgrOptions: {
        icon: true,
        exportType: "named",
        namedExport: "ReactComponent",
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // Force a single React instance across all packages (prevents
    // "Cannot read properties of null (reading 'useRef')" from
    // video-react / other libs that bundle their own React copy)
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    // Explicitly include React + Radix tooltip together so Vite
    // pre-bundles them as a single chunk with one shared React copy.
    include: [
      "react",
      "react-dom",
      "@radix-ui/react-tooltip",
    ],
    // Exclude firebase sub-packages from pre-bundling so they are
    // loaded as plain ES modules — avoids CJS/ESM interop mismatches.
    exclude: ["firebase/app", "firebase/messaging"],
  },
});
