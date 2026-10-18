#!/usr/bin/env node
import {
  KrnlPackageReconciler,
  generateMagneticDeclarations,
  runBuild,
  runDev,
  runGenerate,
  runValidate
} from "../chunk-PUYHQR4K.js";

// src/bin/krnl.ts
import * as path from "path";
import * as fs from "fs";
var args = process.argv.slice(2);
var command = args[0] || "help";
async function main() {
  switch (command) {
    case "sync": {
      const targetDir = args[1] && !args[1].startsWith("-") ? path.resolve(process.cwd(), args[1]) : process.cwd();
      console.log("\u{1F4E6} [Krnl Sync] Reconciling package.json from all manifest.json files...");
      const res = KrnlPackageReconciler.reconcile(targetDir, true);
      console.log(`\u2705 Reconciled dependencies from ${res.totalManifests} manifest.json file(s).`);
      if (res.conflicts.length > 0) {
        console.warn("\u26A0\uFE0F Version conflicts detected across manifests:", res.conflicts);
      }
      break;
    }
    case "validate": {
      const targetDir = args[1] && !args[1].startsWith("-") ? path.resolve(process.cwd(), args[1]) : process.cwd();
      const valid = await runValidate(targetDir);
      process.exit(valid ? 0 : 1);
      break;
    }
    case "generate": {
      const type = args[1];
      const name = args[2];
      const parent = args[3];
      await runGenerate(type, name, parent, process.cwd());
      break;
    }
    case "watch": {
      generateMagneticDeclarations(process.cwd());
      if (args.includes("--watch") || args.includes("-w")) {
        console.log("[Krnl Watch] Continuous watcher enabled.");
        fs.watch(process.cwd(), { recursive: true }, (_evt, filename) => {
          if (filename && (filename.endsWith(".ts") || filename.endsWith(".js")) && !filename.includes("krnl-magnetic.d.ts")) {
            try {
              generateMagneticDeclarations(process.cwd());
            } catch (e) {
            }
          }
          if (filename && filename.endsWith("manifest.json")) {
            try {
              KrnlPackageReconciler.reconcile(process.cwd(), true);
            } catch (e) {
            }
          }
        });
      }
      break;
    }
    case "build": {
      const targetDir = args[1] && !args[1].startsWith("-") ? path.resolve(process.cwd(), args[1]) : process.cwd();
      const entityArgIdx = args.indexOf("--entity");
      const targetEntity = entityArgIdx !== -1 ? args[entityArgIdx + 1] : void 0;
      const isAll = args.includes("--all");
      const res = await runBuild(targetDir, { entity: targetEntity, all: isAll });
      process.exit(res.success ? 0 : 1);
      break;
    }
    case "dev": {
      const targetDir = args[1] && !args[1].startsWith("-") ? path.resolve(process.cwd(), args[1]) : process.cwd();
      const portArgIdx = args.indexOf("--port");
      const port = portArgIdx !== -1 ? parseInt(args[portArgIdx + 1], 10) : 8080;
      const entityArgIdx = args.indexOf("--entity");
      const targetEntity = entityArgIdx !== -1 ? args[entityArgIdx + 1] : void 0;
      const isAll = args.includes("--all");
      const dryRun = args.includes("--dry-run") || args.includes("--once");
      const devInstance = await runDev(targetDir, { port, entity: targetEntity, all: isAll, dryRun });
      if (dryRun) {
        process.exit(0);
      }
      process.on("SIGINT", async () => {
        await devInstance.close();
        process.exit(0);
      });
      process.on("SIGTERM", async () => {
        await devInstance.close();
        process.exit(0);
      });
      break;
    }
    case "help":
    default: {
      console.log(`
\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557
\u2551             Krnl Backend Service Framework CLI                \u2551
\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D

Usage: krnl <command> [options]

Commands:
  dev               Start Krnl service dev server with hot declaration watcher
  build             Validate, generate declarations, and compile project to dist/
  validate          Run deep AST & 4-layer function purity validation
  sync              Reconcile package.json from all co-located manifest.json files
  watch             Generate ambient TypeScript declarations (krnl-magnetic.d.ts)
  generate          Scaffold entities, functionalities, libraries
                    Examples:
                      krnl generate entity UserSystem
                      krnl generate functionality CreateProfile
                      krnl generate library Math

Options:
  --entity <name>   Target a specific entity app variant to run or build
  --all             Run or build all entities as a combined multi-entity build
  --port <number>   Specify port for Krnl service dev server (default: 8080)
  --dry-run, --once Verify environment without running persistent server
  --watch, -w       Enable continuous file watcher (for watch command)
  --help, -h        Show this help message
`);
      break;
    }
  }
}
main().catch((err) => {
  console.error("\u274C Fatal error:", err);
  process.exit(1);
});
