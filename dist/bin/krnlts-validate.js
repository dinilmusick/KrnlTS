#!/usr/bin/env node

// src/krnl/tools/K_LIB_Krnl_Build_Validator.ts
import * as fs from "fs";
import * as path from "path";
var KrnlBuildValidator = class {
  /**
   * Reads and parses krnl.json from specified directory
   */
  static readManifest(dirPath) {
    const manifestPath = path.join(dirPath, "krnl.json");
    if (!fs.existsSync(manifestPath)) {
      return null;
    }
    try {
      const content = fs.readFileSync(manifestPath, "utf-8");
      return JSON.parse(content);
    } catch (err) {
      throw new Error(`[ERR_KRNL_MANIFEST_PARSE_ERROR] Failed to parse manifest at ${manifestPath}: ${err.message}`);
    }
  }
  /**
   * Validates project dependencies statically at build time.
   * Scans project root krnl.json and checks if required subapps and required remotes can be satisfied.
   */
  static validateProject(projectRoot2) {
    const errors = [];
    const mainManifest = this.readManifest(projectRoot2);
    if (!mainManifest) {
      return { valid: true, errors: [] };
    }
    const subappsDir = path.join(projectRoot2, "subapps");
    const existingSubapps = /* @__PURE__ */ new Set();
    if (fs.existsSync(subappsDir)) {
      const entries = fs.readdirSync(subappsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          existingSubapps.add(entry.name);
          const subManifest = this.readManifest(path.join(subappsDir, entry.name));
          if (subManifest && subManifest.appName) {
            existingSubapps.add(subManifest.appName);
          }
        }
      }
    }
    if (mainManifest.dependencies?.subapps) {
      for (const subdep of mainManifest.dependencies.subapps) {
        if (subdep.required !== false) {
          if (!existingSubapps.has(subdep.name)) {
            errors.push(`[ERR_MISSING_SUBAPP_DEPENDENCY] Required sub-app '${subdep.name}' listed in krnl.json was not found in 'subapps/' directory.`);
          }
        }
      }
    }
    if (mainManifest.dependencies?.requiredRemotes) {
      for (const remote of mainManifest.dependencies.requiredRemotes) {
        if (remote.targetEntity) {
          const isSelf = mainManifest.appName === remote.targetEntity || mainManifest.entityClass === remote.targetEntity;
          if (!isSelf && !existingSubapps.has(remote.targetEntity)) {
            errors.push(`[ERR_MISSING_REMOTE_TARGET] Required remote functionality '${remote.fid}' target entity '${remote.targetEntity}' is not provided by any sub-app in 'subapps/'.`);
          }
        }
      }
    }
    return {
      valid: errors.length === 0,
      errors
    };
  }
};

// src/bin/krnlts-validate.ts
var projectRoot = process.cwd();
console.log(`[KrnlTS Build Validator] Validating project manifest at: ${projectRoot}`);
try {
  const result = KrnlBuildValidator.validateProject(projectRoot);
  if (!result.valid) {
    console.error("\n\u274C [KRNLTS BUILD VALIDATION FAILED]");
    for (const err of result.errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  } else {
    console.log("\u2705 [KrnlTS Build Validator] krnl.json dependency validation passed cleanly.");
    process.exit(0);
  }
} catch (err) {
  console.error(`
\u274C [KRNLTS BUILD VALIDATION ERROR] ${err.message}`);
  process.exit(1);
}
