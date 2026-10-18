#!/usr/bin/env node
import * as path from "path";
import * as fs from "fs";
import { runValidate } from "../commands/validate.js";
import { runGenerate } from "../commands/generate.js";
import { generateMagneticDeclarations } from "../commands/watch.js";
import { KrnlPackageReconciler } from "@ultrst-armada/krnl-core";

const args = process.argv.slice(2);
const command = args[0] || "help";

function detectAppEntrypoint(projectRoot: string): string | null {
  const files = fs.readdirSync(projectRoot);
  for (const f of files) {
    if (f.endsWith(".ts") && !f.endsWith(".d.ts") && f !== "tsup.config.ts") {
      const full = path.join(projectRoot, f);
      try {
        const text = fs.readFileSync(full, "utf8");
        if (text.includes("defineApp") || text.includes("@ultrst-armada/krnl-core")) {
          return f;
        }
      } catch (e) {}
    }
  }
  return null;
}

async function main() {
  switch (command) {
    case "sync": {
      const targetDir = args[1] && !args[1].startsWith("-") ? path.resolve(process.cwd(), args[1]) : process.cwd();
      console.log("📦 [Krnl Sync] Reconciling package.json from all manifest.json files...");
      const res = KrnlPackageReconciler.reconcile(targetDir, true);
      console.log(`✅ Reconciled dependencies from ${res.totalManifests} manifest.json file(s).`);
      if (res.conflicts.length > 0) {
        console.warn("⚠️ Version conflicts detected across manifests:", res.conflicts);
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
        fs.watch(process.cwd(), { recursive: true }, (evt, filename) => {
          if (filename && (filename.endsWith(".ts") || filename.endsWith(".js")) && !filename.includes("krnl-magnetic.d.ts")) {
            try {
              generateMagneticDeclarations(process.cwd());
            } catch (e) {}
          }
          if (filename && filename.endsWith("manifest.json")) {
            try {
              KrnlPackageReconciler.reconcile(process.cwd(), true);
            } catch (e) {}
          }
        });
      }
      break;
    }
    case "build": {
      const projectRoot = process.cwd();
      const appFile = detectAppEntrypoint(projectRoot);
      const entityArgIdx = args.indexOf("--entity");
      const targetEntity = entityArgIdx !== -1 ? args[entityArgIdx + 1] : undefined;
      const isAll = args.includes("--all");

      // Auto-reconcile package dependencies from manifests
      KrnlPackageReconciler.reconcile(projectRoot, true);

      if (appFile) {
        console.log(`🏗️  [Krnl Build] Found application entrypoint: ${appFile}`);
      }

      if (targetEntity) {
        console.log(`🏗️  [Krnl Build] Validating and building app variant for entity "${targetEntity}"...`);
      } else if (isAll) {
        console.log(`🏗️  [Krnl Build] Validating and building combined multi-entity application...`);
      } else {
        console.log(`🏗️  [Krnl Build] Validating and building project...`);
      }

      const valid = await runValidate(projectRoot);
      if (!valid) {
        console.error("❌ Build aborted due to validation errors.");
        process.exit(1);
      }
      generateMagneticDeclarations(projectRoot);
      console.log(`✅ [Krnl Build] Validation and ambient declaration generation completed successfully.`);
      break;
    }
    case "dev": {
      const projectRoot = process.cwd();
      const appFile = detectAppEntrypoint(projectRoot);
      const portArgIdx = args.indexOf("--port");
      const port = portArgIdx !== -1 ? parseInt(args[portArgIdx + 1], 10) : 8080;
      const entityArgIdx = args.indexOf("--entity");
      const targetEntity = entityArgIdx !== -1 ? args[entityArgIdx + 1] : undefined;
      const isAll = args.includes("--all");

      // Auto-reconcile package dependencies from manifests
      KrnlPackageReconciler.reconcile(projectRoot, true);

      if (appFile) {
        console.log(`⚡ [Krnl Dev] Booting app configuration from: ${appFile}`);
      }

      if (targetEntity) {
        console.log(`⚡ [Krnl Dev] Initializing app variant for entity "${targetEntity}" on port ${port}...`);
      } else if (isAll) {
        console.log(`⚡ [Krnl Dev] Initializing combined multi-entity workspace on port ${port}...`);
      } else {
        console.log(`⚡ [Krnl Dev] Initializing Krnl backend service workspace on port ${port}...`);
      }

      generateMagneticDeclarations(projectRoot);
      console.log(`⚡ [Krnl Dev] Development environment ready.`);
      break;
    }
    case "help":
    default: {
      console.log(`
╔═══════════════════════════════════════════════════════════════╗
║             Krnl Backend Service Framework CLI                ║
╚═══════════════════════════════════════════════════════════════╝

Usage: krnl <command> [options]

Commands:
  dev               Start Krnl service dev server & boot service entrypoint
  build             Validate and build project for production
  validate          Run deep AST & 4-layer function purity validation
  sync              Reconcile package.json from all co-located manifest.json files
  watch             Generate ambient TypeScript declarations (krnl-magnetic.d.ts)
  generate          Scaffold entities, functionalities, libraries, subapps
                    Examples:
                      krnl generate entity UserSystem
                      krnl generate functionality CreateProfile
                      krnl generate library Math
                      krnl generate subapp BillingEngine

Options:
  --entity <name>   Target a specific entity app variant to run or build
  --all             Run or build all entities as a combined multi-entity build
  --port <number>   Specify port for Krnl service dev server (default: 8080)
  --watch, -w       Enable continuous file watcher (for watch command)
  --help, -h        Show this help message
`);
      break;
    }
  }
}

main().catch(err => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
