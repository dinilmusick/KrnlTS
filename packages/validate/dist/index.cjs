"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  KrnlValidatorEngine: () => KrnlValidatorEngine
});
module.exports = __toCommonJS(index_exports);

// src/KrnlValidatorEngine.ts
var fs = __toESM(require("fs"), 1);
var path = __toESM(require("path"), 1);
var import_ts_morph = require("ts-morph");
var KrnlValidatorEngine = class {
  project;
  projectRoot;
  maxFileLineLimit;
  maxMainLogicLimit;
  maxHelperLineLimit;
  constructor(options) {
    this.projectRoot = path.resolve(options.projectRoot);
    this.maxFileLineLimit = options.maxFileLineLimit ?? 200;
    this.maxMainLogicLimit = options.maxMainLogicLimit ?? 20;
    this.maxHelperLineLimit = options.maxHelperLineLimit ?? 30;
    const tsConfigPath = path.join(this.projectRoot, "tsconfig.json");
    if (fs.existsSync(tsConfigPath)) {
      this.project = new import_ts_morph.Project({ tsConfigFilePath: tsConfigPath, skipAddingFilesFromTsConfig: true });
    } else {
      this.project = new import_ts_morph.Project({ compilerOptions: {
        target: 99
        /* ESNext */
      } });
    }
  }
  /**
   * Scans and validates all source files in the project.
   */
  validateAll() {
    const files = this.collectSourceFiles(this.projectRoot);
    const errors = [];
    const warnings = [];
    for (const f of files) {
      const sf = this.project.addSourceFileAtPath(f);
      const fileReport = this.validateSourceFile(sf);
      errors.push(...fileReport.errors);
      warnings.push(...fileReport.warnings);
    }
    return {
      valid: errors.length === 0,
      totalFiles: files.length,
      errors,
      warnings
    };
  }
  /**
   * Validates a single SourceFile.
   */
  validateSourceFile(sf) {
    const errors = [];
    const warnings = [];
    const filePath = sf.getFilePath();
    const sourceText = sf.getText();
    const baseName = path.basename(filePath);
    if (baseName.includes("_pb.") || baseName.endsWith(".d.ts")) {
      return { errors, warnings };
    }
    const lines = sourceText.split("\n");
    if (lines.length > this.maxFileLineLimit) {
      errors.push({
        ruleId: "krnl/file-line-limit",
        filePath,
        message: `File exceeds maximum length of ${this.maxFileLineLimit} lines (currently ${lines.length} lines).`,
        severity: "error"
      });
    }
    for (const decl of sf.getImportDeclarations()) {
      const moduleSpec = decl.getModuleSpecifierValue();
      if (moduleSpec.startsWith(".") && !moduleSpec.endsWith(".js") && !moduleSpec.endsWith(".json")) {
        const line = decl.getStartLineNumber();
        errors.push({
          ruleId: "krnl/import-suffix",
          filePath,
          line,
          message: `Relative import '${moduleSpec}' must end with '.js' for NodeNext module resolution.`,
          severity: "error"
        });
      }
    }
    const isHelper = filePath.includes("helper_functions") || filePath.includes("/helpers/") || filePath.includes("\\helpers\\");
    const isMainLogic = filePath.endsWith("logic.ts") || filePath.endsWith("logic.js");
    const isRootConcept = filePath.includes("libraries/") || filePath.includes("Concepts.ts");
    if (isHelper) {
      for (const decl of sf.getImportDeclarations()) {
        const spec = decl.getModuleSpecifierValue();
        if (["fs", "node:fs", "http", "node:http", "ws"].includes(spec)) {
          errors.push({
            ruleId: "krnl/helper-purity",
            filePath,
            line: decl.getStartLineNumber(),
            message: `Helper functions (Layer 1) cannot directly import I/O modules ('${spec}'). Delegate to Layer 0 libraries or Entity context.`,
            severity: "error"
          });
        }
      }
      for (const fn of sf.getFunctions()) {
        const fnLines = fn.getText().split("\n").length;
        if (fnLines > this.maxHelperLineLimit && !sourceText.includes("Concepts.")) {
          errors.push({
            ruleId: "krnl/helper-line-limit",
            filePath,
            line: fn.getStartLineNumber(),
            message: `Helper function '${fn.getName() || "anonymous"}' exceeds ${this.maxHelperLineLimit} lines (${fnLines} lines). Must delegate to a root libraries/{Domain}Concepts.ts library.`,
            severity: "error"
          });
        }
      }
    }
    if (isMainLogic) {
      const substantiveLines = lines.filter((l) => {
        const trimmed = l.trim();
        return trimmed.length > 0 && !trimmed.startsWith("//") && !trimmed.startsWith("/*") && !trimmed.startsWith("*");
      });
      if (substantiveLines.length > this.maxMainLogicLimit && !sourceText.includes("helpers") && !sourceText.includes("Concepts") && !sourceText.includes("state")) {
        errors.push({
          ruleId: "krnl/main-delegation",
          filePath,
          message: `Main logic function has ${substantiveLines.length} substantive lines without delegating to Layer 1 helper functions or Layer 0 libraries.`,
          severity: "error"
        });
      }
    }
    if (sourceText.includes("main = async") || sourceText.includes("export const main = async")) {
      const match = sourceText.match(/main\s*=\s*async\s*\([^,]+,\s*\{([^}]*)\}\s*\)/);
      if (match) {
        const destructured = match[1];
        if (/\bsystem\b/.test(destructured) && !/\bentity\b/.test(destructured)) {
          errors.push({
            ruleId: "krnl/context-destructuring",
            filePath,
            message: `Functionality context parameter destructures 'system'. Functionality passes { state, entity }. Always destructure 'entity'.`,
            severity: "error"
          });
        }
      }
    }
    const calls = sf.getDescendantsOfKind(import_ts_morph.SyntaxKind.CallExpression);
    for (const call of calls) {
      const exprText = call.getExpression().getText();
      if (exprText === "setInterval" || exprText === "window.setInterval") {
        errors.push({
          ruleId: "krnl/no-polling",
          filePath,
          line: call.getStartLineNumber(),
          message: `Prohibited use of 'setInterval'. Krnl applications must use reactive event streams (entity.emitEvent / entity.on).`,
          severity: "error"
        });
      }
    }
    const isEntityClass = sf.getClasses().some((c) => {
      const ext = c.getExtends();
      return ext && (ext.getText().includes("Entity") || ext.getText().includes("krnlEntityBase"));
    });
    if (isEntityClass) {
      let loadAllLine = -1;
      const addLocalLines = [];
      for (const call of calls) {
        const txt = call.getText();
        if (txt.includes("MagneticLoader.loadAll") || txt.includes("KrnlMagneticLoader.loadAll")) {
          loadAllLine = call.getStartLineNumber();
        } else if (txt.startsWith("this.addLocal(")) {
          const hasUiSpec = txt.includes("uiSpec");
          const idMatch = txt.match(/id\s*:\s*["']([^"']+)["']/);
          addLocalLines.push({
            line: call.getStartLineNumber(),
            hasUiSpec,
            id: idMatch ? idMatch[1] : "unknown"
          });
        }
      }
      if (loadAllLine !== -1) {
        for (const al of addLocalLines) {
          if (al.hasUiSpec && al.line > loadAllLine) {
            errors.push({
              ruleId: "krnl/boot-order",
              filePath,
              line: al.line,
              message: `addLocal('${al.id}') with uiSpec at line ${al.line} appears AFTER loadAll() at line ${loadAllLine}. All addLocal() with UI must precede loadAll().`,
              severity: "error"
            });
          }
        }
      }
    }
    return { errors, warnings };
  }
  collectSourceFiles(dir, collected = []) {
    if (!fs.existsSync(dir)) return collected;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".git") continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        this.collectSourceFiles(full, collected);
      } else if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".js"))) {
        collected.push(full);
      }
    }
    return collected;
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  KrnlValidatorEngine
});
