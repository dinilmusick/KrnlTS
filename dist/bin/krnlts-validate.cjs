#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/krnl/tools/K_LIB_Krnl_Build_Validator.ts
var fs = __toESM(require("fs"), 1);
var path = __toESM(require("path"), 1);
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
