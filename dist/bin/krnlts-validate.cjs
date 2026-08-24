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
var path3 = __toESM(require("path"), 1);

// src/krnl/tools/K_LIB_Krnl_Purity_Rules.ts
var path2 = __toESM(require("path"), 1);
var KrnlPurityRules = class {
  /**
   * Asserts file line limit is <= 200 lines.
   */
  static checkFileLineLimit(filePath, source) {
    const lineCount = source.split("\n").length;
    if (lineCount > 200) {
      return `[ERR_FILE_LINE_LIMIT_EXCEEDED] '${path2.basename(filePath)}' has ${lineCount} lines (strict maximum is 200 lines).`;
    }
    return null;
  }
  /**
   * Asserts all local relative imports end in .js suffix.
   */
  static checkImportSuffixes(filePath, source) {
    const errors = [];
    const importMatches = source.matchAll(/import\s+.*?from\s+['"](\.[^'"]+)['"]/g);
    for (const match of importMatches) {
      const importPath = match[1];
      if (!importPath.endsWith(".js") && !importPath.endsWith(".json")) {
        errors.push(
          `[ERR_MISSING_JS_IMPORT_SUFFIX] In '${path2.basename(filePath)}': Import '${importPath}' must end with '.js' for NodeNext compatibility.`
        );
      }
    }
    return errors;
  }
  /**
   * Checks for the silent context destructuring trap ({ state, system } instead of { state, entity }).
   */
  static checkContextDestructuring(filePath, source) {
    if (/main\s*=\s*async\s*\([^,]+,\s*\{[^}]*\bsystem\b[^}]*\}\s*\)/.test(source) || /export\s+const\s+main\s*=\s*async\s*\([^,]+,\s*\{[^}]*\bsystem\b[^}]*\}\s*\)/.test(source)) {
      return `[ERR_CONTEXT_DESTRUCTURING_TRAP] In '${path2.basename(filePath)}': Context parameter destructures 'system'. Functionality context passes { state, entity }. Always destructure 'entity' (or alias as 'entity: system').`;
    }
    return null;
  }
  /**
   * Asserts that helper functions do not import state or perform I/O, and obey the 30-line threshold.
   */
  static checkHelperPurity(filePath, source) {
    const errors = [];
    const isHelper = filePath.includes("helper_functions") || filePath.includes("/helpers/") || filePath.includes("\\helpers\\");
    if (!isHelper) return errors;
    if (/import\s+.*state.*from/.test(source) || /import\s+.*(fs|http|ws).*from/.test(source)) {
      errors.push(
        `[ERR_HELPER_PURITY_VIOLATION] In '${path2.basename(filePath)}': Helper functions (Layer 0A) must be pure and cannot import state or I/O modules.`
      );
    }
    const functions = source.split(/(?:export\s+)?function\s+/);
    for (let i = 1; i < functions.length; i++) {
      const fnBody = functions[i];
      const fnLines = fnBody.split("\n").length;
      if (fnLines > 30 && !fnBody.includes("Concepts.")) {
        errors.push(
          `[ERR_HELPER_LINE_LIMIT_EXCEEDED] In '${path2.basename(filePath)}': Helper function exceeds 30 lines (${fnLines} lines). Must delegate to a universal libraries/{Domain}Concepts.ts function.`
        );
      }
    }
    return errors;
  }
  /**
   * Checks main_function logic for excessive consecutive code without delegation (max 20 lines).
   */
  static checkMainDelegation(filePath, source) {
    const errors = [];
    const isMainLogic = filePath.endsWith("logic.ts") || filePath.endsWith("logic.js");
    if (!isMainLogic) return errors;
    const lines = source.split("\n").filter((l) => l.trim().length > 0 && !l.trim().startsWith("//") && !l.trim().startsWith("/*"));
    if (lines.length > 20 && !source.includes("helpers") && !source.includes("helper") && !source.includes("Concepts") && !source.includes("state")) {
      errors.push(
        `[ERR_MAIN_DELEGATION_REQUIRED] In '${path2.basename(filePath)}': Main logic function has ${lines.length} lines of inline code without delegating to helpers or state accessors.`
      );
    }
    return errors;
  }
};

// src/krnl/tools/K_LIB_Krnl_Source_Analyzer.ts
var KrnlSourceAnalyzer = class {
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
  static getMagneticLoaderLine(source) {
    const lines = source.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (/(?:KrnlMagneticLoader|MagneticLoader)\.loadAll\s*\(/.test(lines[i])) {
        return i + 1;
      }
    }
    return -1;
  }
  static validateEntitySource(filePath) {
    const errors = [];
    const warnings = [];
    if (!fs2.existsSync(filePath)) return { valid: true, errors: [], warnings: [] };
    const baseName = path3.basename(filePath);
    if (baseName.includes("_pb.") || baseName.endsWith(".d.ts")) {
      return { valid: true, errors: [], warnings: [] };
    }
    const source = fs2.readFileSync(filePath, "utf-8");
    const isEntityClass = /class\s+\w+\s+extends\s+(?:krnlEntityBase|Entity|krnlSystemEntityBase)/.test(source);
    const lineLimitErr = KrnlPurityRules.checkFileLineLimit(filePath, source);
    if (lineLimitErr) errors.push(lineLimitErr);
    errors.push(...KrnlPurityRules.checkImportSuffixes(filePath, source));
    const contextErr = KrnlPurityRules.checkContextDestructuring(filePath, source);
    if (contextErr) errors.push(contextErr);
    errors.push(...KrnlPurityRules.checkHelperPurity(filePath, source));
    errors.push(...KrnlPurityRules.checkMainDelegation(filePath, source));
    if (isEntityClass && !filePath.includes("/bin/")) {
      const addLocals = this.getAddLocalCalls(source);
      const loaderLine = this.getMagneticLoaderLine(source);
      if (loaderLine !== -1) {
        for (const al of addLocals) {
          if (al.hasUiSpec && al.line > loaderLine) {
            errors.push(
              `[ERR_BOOT_ORDER_VIOLATION] In '${path3.basename(filePath)}': addLocal('${al.id}') at line ${al.line} appears AFTER loadAll() at line ${loaderLine}.`
            );
          }
        }
      }
    }
    return { valid: errors.length === 0, errors, warnings };
  }
  static validateProject(projectRoot2) {
    const allErrors = [];
    const allWarnings = [];
    const scanDirs = ["src", "entities", "libraries", "functionalities"];
    for (const d of scanDirs) {
      const targetDir = path3.join(projectRoot2, d);
      if (fs2.existsSync(targetDir)) {
        const files = this.scanSourceFiles(targetDir);
        for (const f of files) {
          const report = this.validateEntitySource(f);
          allErrors.push(...report.errors);
          allWarnings.push(...report.warnings);
        }
      }
    }
    return { valid: allErrors.length === 0, errors: allErrors, warnings: allWarnings };
  }
  static scanSourceFiles(dir, found = []) {
    if (!fs2.existsSync(dir)) return found;
    const entries = fs2.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".git") continue;
      const fullPath = path3.join(dir, entry.name);
      if (entry.isDirectory()) {
        this.scanSourceFiles(fullPath, found);
      } else if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".js"))) {
        found.push(fullPath);
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
