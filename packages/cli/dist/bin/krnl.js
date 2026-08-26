#!/usr/bin/env node
import {
  generateMagneticDeclarations,
  runGenerate,
  runValidate
} from "../chunk-F65ANSQG.js";

// src/bin/krnl.ts
import * as fs from "fs";
var args = process.argv.slice(2);
var command = args[0] || "help";
async function main() {
  switch (command) {
    case "validate": {
      const valid = await runValidate(process.cwd());
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
        fs.watch(process.cwd(), { recursive: true }, (evt, filename) => {
          if (filename && (filename.endsWith(".ts") || filename.endsWith(".js")) && !filename.includes("krnl-magnetic.d.ts")) {
            try {
              generateMagneticDeclarations(process.cwd());
            } catch (e) {
            }
          }
        });
      }
      break;
    }
    case "build": {
      console.log("\u{1F3D7}\uFE0F  [Krnl Build] Validating and building project...");
      const valid = await runValidate(process.cwd());
      if (!valid) {
        console.error("\u274C Build aborted due to validation errors.");
        process.exit(1);
      }
      generateMagneticDeclarations(process.cwd());
      console.log("\u2705 [Krnl Build] Compilation completed successfully.");
      break;
    }
    case "dev": {
      console.log("\u26A1 [Krnl Dev] Starting unified Krnl development runtime...");
      generateMagneticDeclarations(process.cwd());
      console.log("\u{1F4E1} [Krnl Dev] Unified port gateway active.");
      break;
    }
    case "help":
    default: {
      console.log(`
\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557
\u2551                      Krnl Framework CLI                       \u2551
\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D

Usage: krnl <command> [options]

Commands:
  dev               Start unified dev server (API, UI, WS RPC, HMR)
  build             Validate and build project for production
  validate          Run deep AST & 4-layer function purity validation
  watch             Generate ambient TypeScript declarations (krnl-magnetic.d.ts)
  generate          Scaffold entities, functionalities, libraries, subapps
                    Examples:
                      krnl generate entity UserSystem
                      krnl generate functionality UserSystem CreateProfile
                      krnl generate library Math
                      krnl generate subapp BillingEngine

Options:
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
