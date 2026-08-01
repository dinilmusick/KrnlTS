import {
  __esm,
  __export
} from "./chunk-PNKVD2UK.js";

// src/krnl/core/K_LIB_Krnl_Frontend_Builder.ts
var K_LIB_Krnl_Frontend_Builder_exports = {};
__export(K_LIB_Krnl_Frontend_Builder_exports, {
  KrnlFrontendBuilder: () => KrnlFrontendBuilder
});
import fs from "fs";
import path from "path";
var KrnlFrontendBuilder;
var init_K_LIB_Krnl_Frontend_Builder = __esm({
  "src/krnl/core/K_LIB_Krnl_Frontend_Builder.ts"() {
    KrnlFrontendBuilder = class {
      static activeContexts = /* @__PURE__ */ new Map();
      /**
       * Bundles frontend/src/index.tsx -> frontend/dist/bundle.js
       */
      static async build(frontendDir) {
        const entryFile = path.join(frontendDir, "src", "index.tsx");
        if (!fs.existsSync(entryFile)) {
          return false;
        }
        const distDir = path.join(frontendDir, "dist");
        fs.mkdirSync(distDir, { recursive: true });
        try {
          const esbuild = await import("esbuild");
          console.log(`[KrnlFrontendBuilder] Bundling ${entryFile} -> ${distDir}/bundle.js...`);
          await esbuild.build({
            entryPoints: [entryFile],
            bundle: true,
            outfile: path.join(distDir, "bundle.js"),
            loader: {
              ".css": "css",
              ".tsx": "tsx",
              ".ts": "ts",
              ".js": "jsx",
              ".jsx": "jsx"
            },
            jsx: "automatic",
            sourcemap: process.env.NODE_ENV !== "production",
            minify: process.env.NODE_ENV === "production",
            logLevel: "warning"
          });
          console.log(`[KrnlFrontendBuilder] Bundle build successful.`);
          return true;
        } catch (err) {
          if (err.code === "ERR_MODULE_NOT_FOUND" || err.message?.includes("Cannot find module")) {
            console.warn(`[KrnlFrontendBuilder] esbuild peer dependency not found. Skipping build. Run 'npm i esbuild' to enable in-process UI compilation.`);
          } else {
            console.error(`[KrnlFrontendBuilder] Build failed:`, err.message || err);
          }
          return false;
        }
      }
      /**
       * Starts esbuild watch mode for live updates during development
       */
      static async watch(frontendDir) {
        if (this.activeContexts.has(frontendDir)) {
          return;
        }
        const entryFile = path.join(frontendDir, "src", "index.tsx");
        if (!fs.existsSync(entryFile)) {
          return;
        }
        try {
          const esbuild = await import("esbuild");
          const ctx = await esbuild.context({
            entryPoints: [entryFile],
            bundle: true,
            outfile: path.join(frontendDir, "dist", "bundle.js"),
            loader: {
              ".css": "css",
              ".tsx": "tsx",
              ".ts": "ts",
              ".js": "jsx",
              ".jsx": "jsx"
            },
            jsx: "automatic",
            logLevel: "warning"
          });
          await ctx.watch();
          this.activeContexts.set(frontendDir, ctx);
          console.log(`[KrnlFrontendBuilder] esbuild watching ${frontendDir}/src for changes.`);
        } catch (err) {
        }
      }
      static stop(frontendDir) {
        const ctx = this.activeContexts.get(frontendDir);
        if (ctx) {
          ctx.dispose();
          this.activeContexts.delete(frontendDir);
        }
      }
    };
  }
});

export {
  KrnlFrontendBuilder,
  K_LIB_Krnl_Frontend_Builder_exports,
  init_K_LIB_Krnl_Frontend_Builder
};
