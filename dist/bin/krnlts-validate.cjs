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

// src/krnl/tools/K_LIB_Krnl_Source_Analyzer.ts
var fs2 = __toESM(require("fs"), 1);
var path2 = __toESM(require("path"), 1);
var KrnlSourceAnalyzer = class {
  /**
   * Extracts all addLocal() call positions and their uiSpec presence from source.
   */
  static getAddLocalCalls(source) {
    const results = [];
    const lines = source.split("\n");
    let inAddLocal = false;
    let braceDepth = 0;
    let blockStart = -1;
    let blockLines = [];
    let blockId = "";
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!inAddLocal) {
        if (/this\.addLocal\s*\(/.test(line)) {
          inAddLocal = true;
          braceDepth = 0;
          blockStart = i + 1;
          blockLines = [line];
          const idMatch = line.match(/id\s*:\s*["']([^"']+)["']/);
          blockId = idMatch ? idMatch[1] : "";
        }
      } else {
        blockLines.push(line);
        if (!blockId) {
          const idMatch = line.match(/id\s*:\s*["']([^"']+)["']/);
          if (idMatch) blockId = idMatch[1];
        }
        for (const ch of line) {
          if (ch === "{") braceDepth++;
          if (ch === "}") {
            braceDepth--;
            if (braceDepth < 0) {
              const blockSource = blockLines.join("\n");
              const hasUiSpec = /uiSpec\s*:/.test(blockSource);
              results.push({ line: blockStart, hasUiSpec, id: blockId });
              inAddLocal = false;
              blockLines = [];
              blockId = "";
              break;
            }
          }
        }
      }
    }
    return results;
  }
  /**
   * Finds the line number of KrnlMagneticLoader.loadAll() or MagneticLoader.loadAll() in source.
   */
  static getMagneticLoaderLine(source) {
    const lines = source.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (/(?:KrnlMagneticLoader|MagneticLoader)\.loadAll\s*\(/.test(lines[i])) {
        return i + 1;
      }
    }
    return -1;
  }
  /**
   * Checks for bare relative fetch URLs (missing leading slash) in generated component source.
   * These cause page blanks when the browser treats them as relative to the current path.
   */
  static getBareRelativeFetches(source) {
    const lines = source.split("\n");
    const hits = [];
    for (let i = 0; i < lines.length; i++) {
      if (/fetch\s*\(\s*['"][^/h][^'"]*['"]/.test(lines[i])) {
        hits.push(i + 1);
      }
    }
    return hits;
  }
  /**
   * Validates a single entity source file for boot-order constraints.
   *
   * RULE 1: addLocal() calls with uiSpec MUST appear before KrnlMagneticLoader.loadAll()
   * RULE 2: Every addLocal() with ui_component_enabled MUST have ui_component_enabled: true
   */
  static validateEntitySource(filePath) {
    const errors = [];
    const warnings = [];
    if (!fs2.existsSync(filePath)) {
      return { valid: true, errors: [], warnings: [] };
    }
    const source = fs2.readFileSync(filePath, "utf-8");
    const addLocals = this.getAddLocalCalls(source);
    const magneticLoaderLine = this.getMagneticLoaderLine(source);
    if (magneticLoaderLine !== -1) {
      for (const al of addLocals) {
        if (al.hasUiSpec && al.line > magneticLoaderLine) {
          errors.push(
            `[ERR_BOOT_ORDER_VIOLATION] In '${path2.basename(filePath)}': addLocal('${al.id}') with uiSpec at line ${al.line} appears AFTER KrnlMagneticLoader.loadAll() at line ${magneticLoaderLine}. The frontend generator runs inside loadAll() \u2014 if addLocal() calls come after it, the generator sees zero endpoints and produces a blank UI. FIX: Move all addLocal() calls to BEFORE KrnlMagneticLoader.loadAll() in boot().`
          );
        }
      }
    }
    const anyHasUiSpec = addLocals.some((al) => al.hasUiSpec);
    if (anyHasUiSpec) {
      for (const al of addLocals) {
        if (!al.hasUiSpec) {
          warnings.push(
            `[WARN_MISSING_UISPEC] In '${path2.basename(filePath)}': addLocal('${al.id}') at line ${al.line} is missing 'uiSpec'. Other endpoints in this file have uiSpec \u2014 this endpoint will not appear in the UI. Add 'uiSpec: { ui_component_enabled: true, ... }' to include it.`
          );
        }
      }
    }
    if (magneticLoaderLine !== -1 && addLocals.length > 0 && !anyHasUiSpec) {
      warnings.push(
        `[WARN_NO_UISPEC_ENDPOINTS] In '${path2.basename(filePath)}': ${addLocals.length} addLocal() endpoint(s) found but none have 'uiSpec'. The generated frontend will show "No UI-enabled endpoints" message. Add 'uiSpec: { ui_component_enabled: true, inputs: [...], outputs: [...] }' to each addLocal().`
      );
    }
    const allKnownIds = new Set(addLocals.map((al) => al.id));
    const requiresMatches = source.matchAll(/functionalitiesExecuted\s*:\s*\[([^\]]+)\]/g);
    for (const match of requiresMatches) {
      const rawArray = match[1];
      const targetIds = rawArray.split(",").map((s) => s.trim().replace(/['"]/g, ""));
      for (const tid of targetIds) {
        if (tid && !allKnownIds.has(tid)) {
          const atomPattern = new RegExp(`id\\s*:\\s*["']${tid}["']`);
          if (!atomPattern.test(source)) {
            errors.push(
              `[ERR_REQUIRES_UNKNOWN_FID] In '${path2.basename(filePath)}': Functionality requires dependency '${tid}' which is not defined in this application or project.`
            );
          }
        }
      }
    }
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
  /**
   * Validates all entity source files in the project.
   * Scans for *.ts and *.js files in src/ that extend krnlSystemEntityBase or krnlEntityBase.
   */
  static validateProject(projectRoot2) {
    const allErrors = [];
    const allWarnings = [];
    const srcDir = path2.join(projectRoot2, "src");
    if (!fs2.existsSync(srcDir)) {
      return { valid: true, errors: [], warnings: [] };
    }
    const entityFiles = this.findEntityFiles(srcDir);
    for (const filePath of entityFiles) {
      const result = this.validateEntitySource(filePath);
      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);
    }
    return {
      valid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings
    };
  }
  static findEntityFiles(dir, found = []) {
    if (!fs2.existsSync(dir)) return found;
    const entries = fs2.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".git") continue;
      const fullPath = path2.join(dir, entry.name);
      if (entry.isDirectory()) {
        this.findEntityFiles(fullPath, found);
      } else if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".js"))) {
        try {
          const content = fs2.readFileSync(fullPath, "utf-8");
          if (content.includes("krnlSystemEntityBase") || content.includes("krnlEntityBase") || content.includes("addLocal(")) {
            found.push(fullPath);
          }
        } catch (_) {
        }
      }
    }
    return found;
  }
};

// src/bin/krnlts-validate.ts
var projectRoot = process.cwd();
console.log(`[KrnlTS Validate] Validating project at: ${projectRoot}
`);
var hasErrors = false;
try {
  const result = KrnlBuildValidator.validateProject(projectRoot);
  if (!result.valid) {
    console.error("\u274C [MANIFEST VALIDATION FAILED]");
    for (const err of result.errors) {
      console.error(`  - ${err}`);
    }
    hasErrors = true;
  } else {
    console.log("\u2705 Manifest (krnl.json) dependency validation passed.");
  }
} catch (err) {
  console.error(`
\u274C [MANIFEST VALIDATION ERROR] ${err.message}`);
  hasErrors = true;
}
try {
  const result = KrnlSourceAnalyzer.validateProject(projectRoot);
  if (result.warnings.length > 0) {
    console.warn("\n\u26A0\uFE0F  [SOURCE ANALYSIS WARNINGS]");
    for (const w of result.warnings) {
      console.warn(`  - ${w}`);
    }
  }
  if (!result.valid) {
    console.error("\n\u274C [SOURCE ANALYSIS FAILED]");
    for (const err of result.errors) {
      console.error(`
  \u274C ${err}`);
    }
    console.error(`
\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557
\u2551  KRNLTS BOOT ORDER CONSTRAINT VIOLATED                                      \u2551
\u2551                                                                              \u2551
\u2551  Rule: ALL addLocal() calls with uiSpec must come BEFORE                    \u2551
\u2551        KrnlMagneticLoader.loadAll() in boot().                               \u2551
\u2551                                                                              \u2551
\u2551  Why: MagneticLoader.loadAll() calls KrnlFrontendGenerator.generate()       \u2551
\u2551       internally. At that moment, any addLocal() calls not yet executed     \u2551
\u2551       are invisible \u2192 the generator produces a blank "No UI endpoints" UI.  \u2551
\u2551                                                                              \u2551
\u2551  Fix: Move all this.addLocal({ id: "...", uiSpec: {...}, api: ... })        \u2551
\u2551       calls to BEFORE the KrnlMagneticLoader.loadAll(this, projectRoot)     \u2551
\u2551       line in your entity's boot() method.                                  \u2551
\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D
`);
    hasErrors = true;
  } else {
    console.log("\u2705 Source analysis (boot order + uiSpec constraints) passed.");
  }
} catch (err) {
  console.error(`
\u274C [SOURCE ANALYSIS ERROR] ${err.message}`);
  hasErrors = true;
}
if (hasErrors) {
  process.exit(1);
} else {
  console.log("\n\u2705 All KrnlTS validations passed cleanly.");
  process.exit(0);
}
