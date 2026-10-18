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
  generateMagneticDeclarations: () => generateMagneticDeclarations,
  runBuild: () => runBuild,
  runDev: () => runDev,
  runGenerate: () => runGenerate,
  runValidate: () => runValidate
});
module.exports = __toCommonJS(index_exports);

// ../validate/dist/index.js
var fs2 = __toESM(require("fs"), 1);
var path4 = __toESM(require("path"), 1);
var import_ts_morph = require("ts-morph");
var path = __toESM(require("path"), 1);
var import_ts_morph2 = require("ts-morph");
var path2 = __toESM(require("path"), 1);
var import_ts_morph3 = require("ts-morph");
var fs = __toESM(require("fs"), 1);
var path3 = __toESM(require("path"), 1);
var import_ts_morph4 = require("ts-morph");
function checkFileLimits(sf, options) {
  const errors = [];
  const warnings = [];
  const filePath = sf.getFilePath();
  const sourceText = sf.getFullText();
  const lines = sourceText.split("\n");
  if (lines.length > options.maxFileLineLimit) {
    errors.push({
      ruleId: "krnl/file-line-limit",
      filePath,
      message: `File exceeds maximum length of ${options.maxFileLineLimit} lines (currently ${lines.length} lines). Decompose into sub-components, custom hooks, quad-units, or concept libraries.`,
      severity: "error"
    });
  }
  for (const decl of sf.getImportDeclarations()) {
    const moduleSpec = decl.getModuleSpecifierValue();
    if (moduleSpec.startsWith(".") && !moduleSpec.endsWith(".js") && !moduleSpec.endsWith(".json") && !moduleSpec.endsWith(".css") && !moduleSpec.endsWith(".svg") && !moduleSpec.endsWith(".png")) {
      errors.push({
        ruleId: "krnl/import-suffix",
        filePath,
        line: decl.getStartLineNumber(),
        message: `Relative import '${moduleSpec}' must end with '.js' for NodeNext module resolution.`,
        severity: "error"
      });
    }
  }
  const isHelper = filePath.includes("helper_functions") || filePath.includes("/helpers/") || filePath.includes("\\helpers\\");
  if (isHelper) {
    for (const fn of sf.getFunctions()) {
      const fnLines = fn.getText().split("\n").length;
      if (fnLines > options.maxHelperLineLimit && !sourceText.includes("Concepts.")) {
        errors.push({
          ruleId: "krnl/helper-line-limit",
          filePath,
          line: fn.getStartLineNumber(),
          message: `Helper function '${fn.getName() || "anonymous"}' exceeds ${options.maxHelperLineLimit} lines (${fnLines} lines). Must delegate to a root libraries/{Domain}Concepts.ts library.`,
          severity: "error"
        });
      }
    }
  }
  const isMainLogic = filePath.endsWith("logic.ts") || filePath.endsWith("logic.js");
  if (isMainLogic) {
    const substantiveLines = lines.filter((l) => {
      const trimmed = l.trim();
      return trimmed.length > 0 && !trimmed.startsWith("//") && !trimmed.startsWith("/*") && !trimmed.startsWith("*");
    });
    if (substantiveLines.length > options.maxMainLogicLimit && !sourceText.includes("helpers") && !sourceText.includes("Concepts") && !sourceText.includes("state")) {
      errors.push({
        ruleId: "krnl/main-delegation",
        filePath,
        message: `Main logic function has ${substantiveLines.length} substantive lines without delegating to Layer 1 helper functions or Layer 0 libraries.`,
        severity: "error"
      });
    }
  }
  return { errors, warnings };
}
function checkComponentRules(sf) {
  const errors = [];
  const warnings = [];
  const filePath = sf.getFilePath();
  const baseName = path.basename(filePath);
  if (filePath.endsWith(".tsx") || filePath.endsWith(".jsx")) {
    const componentNames = [];
    for (const fn of sf.getFunctions()) {
      const name = fn.getName();
      if (name && /^[A-Z]/.test(name)) {
        const hasJsx = fn.getDescendantsOfKind(import_ts_morph2.SyntaxKind.JsxElement).length > 0 || fn.getDescendantsOfKind(import_ts_morph2.SyntaxKind.JsxSelfClosingElement).length > 0 || fn.getDescendantsOfKind(import_ts_morph2.SyntaxKind.JsxFragment).length > 0;
        if (hasJsx) componentNames.push(name);
      }
    }
    for (const stmt of sf.getVariableStatements()) {
      for (const decl of stmt.getDeclarations()) {
        const name = decl.getName();
        if (/^[A-Z]/.test(name)) {
          const typeText = decl.getTypeNode()?.getText() || "";
          const isFcType = typeText.includes("FC") || typeText.includes("FunctionComponent") || typeText.includes("ComponentType");
          const init = decl.getInitializer();
          if (init) {
            const hasJsx = init.getDescendantsOfKind(import_ts_morph2.SyntaxKind.JsxElement).length > 0 || init.getDescendantsOfKind(import_ts_morph2.SyntaxKind.JsxSelfClosingElement).length > 0 || init.getDescendantsOfKind(import_ts_morph2.SyntaxKind.JsxFragment).length > 0;
            if (isFcType || hasJsx) {
              if (!componentNames.includes(name)) componentNames.push(name);
            }
          }
        }
      }
    }
    for (const cls of sf.getClasses()) {
      const name = cls.getName();
      const ext = cls.getExtends()?.getText() || "";
      if (name && (ext.includes("Component") || ext.includes("PureComponent"))) {
        if (!componentNames.includes(name)) componentNames.push(name);
      }
    }
    if (componentNames.length > 1) {
      errors.push({
        ruleId: "krnl/one-component-per-file",
        filePath,
        message: `File '${baseName}' defines multiple React components (${componentNames.join(
          ", "
        )}). Krnl strictly enforces ONE component per file. Decompose into sub-component files.`,
        severity: "error"
      });
    }
  }
  const isHelper = filePath.includes("helper_functions") || filePath.includes("/helpers/") || filePath.includes("\\helpers\\");
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
  }
  return { errors, warnings };
}
function checkEntityRules(sf) {
  const errors = [];
  const warnings = [];
  const filePath = sf.getFilePath();
  const sourceText = sf.getText();
  const baseName = path2.basename(filePath);
  const calls = sf.getDescendantsOfKind(import_ts_morph3.SyntaxKind.CallExpression);
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
  const isEntityClass = sf.getClasses().some((c) => {
    const ext = c.getExtends();
    return ext && (ext.getText().includes("Entity") || ext.getText().includes("krnlEntityBase"));
  });
  if (isEntityClass) {
    for (const decl of sf.getImportDeclarations()) {
      const spec = decl.getModuleSpecifierValue();
      if (spec.includes("libraries/") || spec.includes("Concepts")) {
        errors.push({
          ruleId: "krnl/entity-no-libraries",
          filePath,
          line: decl.getStartLineNumber(),
          message: `Entity class violates Library Calling Invariant. Entities must not call or import libraries directly ('${spec}'). Only functionalities in 'src/functionalities/' are permitted to call shared libraries.`,
          severity: "error"
        });
      }
    }
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
    for (const cls of sf.getClasses()) {
      const ext = cls.getExtends();
      if (ext && (ext.getText().includes("Entity") || ext.getText().includes("krnlEntityBase"))) {
        const loops = [
          ...cls.getDescendantsOfKind(import_ts_morph3.SyntaxKind.ForStatement),
          ...cls.getDescendantsOfKind(import_ts_morph3.SyntaxKind.ForOfStatement),
          ...cls.getDescendantsOfKind(import_ts_morph3.SyntaxKind.ForInStatement),
          ...cls.getDescendantsOfKind(import_ts_morph3.SyntaxKind.WhileStatement),
          ...cls.getDescendantsOfKind(import_ts_morph3.SyntaxKind.DoStatement)
        ];
        for (const loop of loops) {
          errors.push({
            ruleId: "krnl/entity-purity",
            filePath,
            line: loop.getStartLineNumber(),
            message: `Entity '${cls.getName() || "Anonymous"}' violates Entity Purity Law. Loops and procedural algorithms are prohibited inside entities. Move logic to a functionality or a global library function.`,
            severity: "error"
          });
        }
        for (const method of cls.getMethods()) {
          const methodName = method.getName();
          if (!["boot", "init", "dispose"].includes(methodName)) {
            errors.push({
              ruleId: "krnl/entity-purity",
              filePath,
              line: method.getStartLineNumber(),
              message: `Entity '${cls.getName() || "Anonymous"}' defines custom method '${methodName}'. Entities are purely declarative compositors/orchestrators. Define capabilities as functionalities or global library functions.`,
              severity: "error"
            });
          }
        }
      }
    }
    for (const call of calls) {
      const callText = call.getText();
      if (callText.startsWith("this.orchestration(") || callText.startsWith("this.flow(")) {
        let currentExpr = call;
        const chainCalls = [];
        while (currentExpr && import_ts_morph3.Node.isCallExpression(currentExpr)) {
          const propAccess = currentExpr.getExpression();
          if (import_ts_morph3.Node.isPropertyAccessExpression(propAccess)) {
            const methodName = propAccess.getName();
            const args = currentExpr.getArguments();
            const argText = args.length > 0 ? args[0].getText() : void 0;
            chainCalls.unshift({ name: methodName, node: currentExpr, argText });
            currentExpr = propAccess.getExpression();
          } else {
            break;
          }
        }
        let chainId = "orchestration";
        for (const step of chainCalls) {
          if (step.name === "orchestration" || step.name === "flow") {
            chainId = step.argText ? step.argText.replace(/['"]/g, "") : "orchestration";
          } else if (step.name === "thenFunction") {
            errors.push({
              ruleId: "krnl/entity-no-direct-library-calls",
              filePath,
              line: step.node.getStartLineNumber(),
              message: `Orchestration chain '${chainId}' violates Entity Purity Law. Entities cannot chain direct library functions via thenFunction(). Entities must only orchestrate functionalities (thenFunctionality) and orchestrations from other entities (thenEntityOrchestration).`,
              severity: "error"
            });
          }
        }
      }
    }
  }
  return { errors, warnings };
}
function checkTopLevelPurity(sf) {
  const errors = [];
  const warnings = [];
  const filePath = sf.getFilePath();
  const baseName = path3.basename(filePath);
  const isUiTopLevel = /^(App|main|index|_app|root)\.(tsx|jsx)$/i.test(baseName);
  const isBackendTopLevel = /^(server|app|index)\.(ts|js)$/i.test(baseName) && !filePath.includes("/components/") && !filePath.includes("/entities/") && !filePath.includes("/libraries/");
  if (isUiTopLevel) {
    const jsxElements = sf.getDescendantsOfKind(import_ts_morph4.SyntaxKind.JsxOpeningElement);
    const jsxSelfClosing = sf.getDescendantsOfKind(import_ts_morph4.SyntaxKind.JsxSelfClosingElement);
    const allJsxTags = [...jsxElements, ...jsxSelfClosing];
    for (const jsx of allJsxTags) {
      const tagName = jsx.getTagNameNode().getText();
      if (/^[a-z]/.test(tagName)) {
        errors.push({
          ruleId: "krnl/top-level-purity",
          filePath,
          line: jsx.getStartLineNumber(),
          message: `Top-level file '${baseName}' violates Top-Level Purity Law. Raw JSX/HTML element '<${tagName}>' is strictly forbidden. Top-level files must ONLY import and compose React components.`,
          severity: "error"
        });
      }
    }
    const calls = sf.getDescendantsOfKind(import_ts_morph4.SyntaxKind.CallExpression);
    for (const call of calls) {
      const exprText = call.getExpression().getText();
      if ([
        "useState",
        "useEffect",
        "useRef",
        "useMemo",
        "useCallback",
        "useReducer",
        "useContext",
        "useLayoutEffect"
      ].includes(exprText) || /^use[A-Z]/.test(exprText) && exprText !== "use") {
        errors.push({
          ruleId: "krnl/top-level-purity",
          filePath,
          line: call.getStartLineNumber(),
          message: `Top-level file '${baseName}' violates Top-Level Purity Law. React hook '${exprText}' is forbidden in top-level files. Encapsulate state and effects inside dedicated component files.`,
          severity: "error"
        });
      }
    }
  }
  if (isBackendTopLevel) {
    const calls = sf.getDescendantsOfKind(import_ts_morph4.SyntaxKind.CallExpression);
    for (const call of calls) {
      const exprText = call.getExpression().getText();
      if (/^(app|router|server)\.(get|post|put|delete|patch|options|head)$/.test(exprText)) {
        errors.push({
          ruleId: "krnl/top-level-purity",
          filePath,
          line: call.getStartLineNumber(),
          message: `Backend entry file '${baseName}' violates Entry Purity Law. Inline route definition '${exprText}' is forbidden. Delegate to dedicated route/controller modules.`,
          severity: "error"
        });
      }
    }
  }
  return { errors, warnings };
}
function checkWorkspaceLayout(projectRoot, errors) {
  const krnlDir = path3.join(projectRoot, "krnl");
  const srcDir = path3.join(projectRoot, "src");
  const targetDir = fs.existsSync(krnlDir) ? krnlDir : fs.existsSync(srcDir) ? srcDir : null;
  if (!targetDir) return;
  const backendDir = path3.join(targetDir, "backend");
  const frontendDir = path3.join(targetDir, "frontend");
  if (fs.existsSync(backendDir)) {
    const bLibs = path3.join(backendDir, "libraries");
    if (fs.existsSync(bLibs)) {
      for (const entry of fs.readdirSync(bLibs, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const libPath = path3.join(bLibs, entry.name);
        if (!fs.existsSync(path3.join(libPath, "manifest.json"))) {
          errors.push({
            ruleId: "krnl/concept-manifest-required",
            filePath: libPath,
            message: `Backend concept library "${entry.name}" is missing a manifest.json file.`,
            severity: "error"
          });
        }
      }
    }
    const bFuncs = path3.join(backendDir, "functionalities");
    if (fs.existsSync(bFuncs)) {
      for (const entry of fs.readdirSync(bFuncs, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const funcPath = path3.join(bFuncs, entry.name);
        if (!fs.existsSync(path3.join(funcPath, "manifest.json"))) {
          errors.push({
            ruleId: "krnl/functionality-manifest-required",
            filePath: funcPath,
            message: `Backend functionality "${entry.name}" is missing a manifest.json file.`,
            severity: "error"
          });
        }
      }
    }
  }
  if (fs.existsSync(frontendDir)) {
    const fLibs = path3.join(frontendDir, "libraries");
    if (fs.existsSync(fLibs)) {
      for (const entry of fs.readdirSync(fLibs, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const libPath = path3.join(fLibs, entry.name);
        if (!fs.existsSync(path3.join(libPath, "manifest.json"))) {
          errors.push({
            ruleId: "krnl/frontend-concept-manifest-required",
            filePath: libPath,
            message: `Frontend concept library "${entry.name}" is missing a manifest.json file.`,
            severity: "error"
          });
        }
      }
    }
    const fFuncs = path3.join(frontendDir, "functionalities");
    if (fs.existsSync(fFuncs)) {
      for (const entry of fs.readdirSync(fFuncs, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const funcPath = path3.join(fFuncs, entry.name);
        if (!fs.existsSync(path3.join(funcPath, "manifest.json"))) {
          errors.push({
            ruleId: "krnl/frontend-functionality-manifest-required",
            filePath: funcPath,
            message: `Frontend functionality "${entry.name}" is missing a manifest.json file.`,
            severity: "error"
          });
        }
      }
    }
  }
}
var KrnlValidatorEngine = class {
  project;
  projectRoot;
  limitOptions;
  constructor(optionsOrRoot) {
    const options = typeof optionsOrRoot === "string" ? { projectRoot: optionsOrRoot } : optionsOrRoot;
    this.projectRoot = path4.resolve(options.projectRoot || process.cwd());
    this.limitOptions = {
      maxFileLineLimit: options.maxFileLineLimit ?? 200,
      maxMainLogicLimit: options.maxMainLogicLimit ?? 20,
      maxHelperLineLimit: options.maxHelperLineLimit ?? 30
    };
    const tsConfigPath = path4.join(this.projectRoot, "tsconfig.json");
    if (fs2.existsSync(tsConfigPath)) {
      this.project = new import_ts_morph.Project({ tsConfigFilePath: tsConfigPath, skipAddingFilesFromTsConfig: true });
    } else {
      this.project = new import_ts_morph.Project({ compilerOptions: {
        target: 99
        /* ESNext */
      } });
    }
  }
  validateAll() {
    const files = this.collectSourceFiles(this.projectRoot);
    const errors = [];
    const warnings = [];
    checkWorkspaceLayout(this.projectRoot, errors);
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
  validateSourceFile(sf) {
    const filePath = sf.getFilePath();
    const baseName = path4.basename(filePath);
    if (baseName.includes("_pb.") || baseName.endsWith(".d.ts")) {
      return { errors: [], warnings: [] };
    }
    const limits = checkFileLimits(sf, this.limitOptions);
    const purity = checkTopLevelPurity(sf);
    const components = checkComponentRules(sf);
    const entity = checkEntityRules(sf);
    return {
      errors: [...limits.errors, ...purity.errors, ...components.errors, ...entity.errors],
      warnings: [...limits.warnings, ...purity.warnings, ...components.warnings, ...entity.warnings]
    };
  }
  collectSourceFiles(dir, collected = []) {
    if (!fs2.existsSync(dir)) return collected;
    const entries = fs2.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".git") continue;
      const full = path4.join(dir, entry.name);
      if (entry.isDirectory()) {
        this.collectSourceFiles(full, collected);
      } else if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".js") || entry.name.endsWith(".tsx") || entry.name.endsWith(".jsx"))) {
        collected.push(full);
      }
    }
    return collected;
  }
};

// src/commands/validate.ts
async function runValidate(projectRoot = process.cwd()) {
  console.log(`
\u{1F50D} [Krnl Validate] Scanning project at: ${projectRoot}
`);
  const validator = new KrnlValidatorEngine({ projectRoot });
  const report = validator.validateAll();
  if (report.warnings.length > 0) {
    console.warn(`\u26A0\uFE0F  [WARNINGS] Found ${report.warnings.length} warning(s):`);
    for (const w of report.warnings) {
      console.warn(`  - [${w.ruleId}] ${w.filePath}${w.line ? `:${w.line}` : ""}: ${w.message}`);
    }
  }
  if (!report.valid) {
    console.error(`
\u274C [VALIDATION FAILED] Found ${report.errors.length} error(s):
`);
    for (const err of report.errors) {
      console.error(`  \u274C [${err.ruleId}] ${err.filePath}${err.line ? `:${err.line}` : ""}`);
      console.error(`     ${err.message}
`);
    }
    return false;
  }
  console.log(`\u2705 [VALIDATION PASSED] ${report.totalFiles} source files verified clean against Krnl paradigms.
`);
  return true;
}

// src/commands/generators/entityGenerator.ts
var fs4 = __toESM(require("fs"), 1);
var path6 = __toESM(require("path"), 1);

// src/commands/generators/common.ts
var fs3 = __toESM(require("fs"), 1);
var path5 = __toESM(require("path"), 1);
function getPlaneRoots(projectRoot) {
  const krnlRoot = path5.join(projectRoot, "krnl");
  if (fs3.existsSync(krnlRoot)) {
    return {
      backend: path5.join(krnlRoot, "backend"),
      frontend: path5.join(krnlRoot, "frontend"),
      isKrnlDir: true
    };
  }
  return {
    backend: path5.join(projectRoot, "src"),
    frontend: path5.join(projectRoot, "src"),
    isKrnlDir: false
  };
}

// src/commands/generators/entityGenerator.ts
function generateEntity(name, projectRoot) {
  const { backend, frontend } = getPlaneRoots(projectRoot);
  const bEntityDir = path6.join(backend, "entities", name);
  fs4.mkdirSync(path6.join(bEntityDir, "orchestrations"), { recursive: true });
  fs4.mkdirSync(path6.join(bEntityDir, "tests"), { recursive: true });
  fs4.writeFileSync(
    path6.join(bEntityDir, `${name}.ts`),
    `import { Entity, KrnlMagneticLoader } from "@ultrst-armada/krnl-core";

/**
 * @role skeleton
 */
export class ${name} extends Entity {
  constructor() {
    super({
      id: "${name}",
      version: "1.0.0",
      description: "${name} entity"
    });
  }

  async boot(): Promise<void> {
    await KrnlMagneticLoader.loadAll(this, import.meta.url);
  }
}

export default ${name};
`
  );
  fs4.writeFileSync(
    path6.join(bEntityDir, "orchestrations", "DefaultFlow.ts"),
    `export function configureDefaultFlow(entity: any) {
  return entity.flow("defaultFlow")
    .register({ visibility: "public" });
}
`
  );
  fs4.writeFileSync(
    path6.join(bEntityDir, "tests", `${name}.test.ts`),
    `import { describe, it, expect } from "vitest";
import { ${name} } from "../${name}.js";

describe("${name} Entity", () => {
  it("instantiates correctly", () => {
    const instance = new ${name}();
    expect(instance.id).toBe("${name}");
  });
});
`
  );
  const fEntityDir = path6.join(frontend, "entities", name);
  fs4.mkdirSync(path6.join(fEntityDir, "tests"), { recursive: true });
  fs4.writeFileSync(
    path6.join(fEntityDir, `${name}0.tsx`),
    `import React from "react";

export const ${name}0: React.FC = () => {
  return (
    <div className="krnl-entity-${name.toLowerCase()}">
      <h2>${name} (Variant 0)</h2>
    </div>
  );
};

export default ${name}0;
`
  );
  fs4.writeFileSync(
    path6.join(fEntityDir, "tests", `${name}0.test.tsx`),
    `import { describe, it, expect } from "vitest";

describe("${name}0 Component", () => {
  it("renders variant 0", () => {
    expect(true).toBe(true);
  });
});
`
  );
  console.log(`\u2705 Created Backend Entity Folder: krnl/backend/entities/${name}/`);
  console.log(`\u2705 Created Frontend Entity Folder: krnl/frontend/entities/${name}/`);
}

// src/commands/generators/functionalityGenerator.ts
var fs6 = __toESM(require("fs"), 1);
var path8 = __toESM(require("path"), 1);

// ../core/dist/index.js
var fs5 = __toESM(require("fs"), 1);
var path7 = __toESM(require("path"), 1);
var KrnlPackageReconciler = class {
  /**
   * Scans all manifest.json files across backend and frontend and reconciles root package.json.
   */
  static reconcile(projectRoot = process.cwd(), writeChanges = true) {
    const manifests = this.findManifests(projectRoot);
    const aggregatedDeps = {};
    const aggregatedDevDeps = {};
    for (const mPath of manifests) {
      try {
        const raw = fs5.readFileSync(mPath, "utf8");
        const json = JSON.parse(raw);
        if (json.dependencies && typeof json.dependencies === "object") {
          for (const [pkg, ver] of Object.entries(json.dependencies)) {
            if (!aggregatedDeps[pkg]) aggregatedDeps[pkg] = [];
            if (!aggregatedDeps[pkg].includes(String(ver))) {
              aggregatedDeps[pkg].push(String(ver));
            }
          }
        }
        if (json.devDependencies && typeof json.devDependencies === "object") {
          for (const [pkg, ver] of Object.entries(json.devDependencies)) {
            if (!aggregatedDevDeps[pkg]) aggregatedDevDeps[pkg] = [];
            if (!aggregatedDevDeps[pkg].includes(String(ver))) {
              aggregatedDevDeps[pkg].push(String(ver));
            }
          }
        }
      } catch (err) {
        console.warn(`[KrnlPackageReconciler] Warning: Could not parse ${mPath}:`, err);
      }
    }
    const conflicts = [];
    const resolvedDeps = {};
    const resolvedDevDeps = {};
    for (const [pkg, versions] of Object.entries(aggregatedDeps)) {
      if (versions.length > 1) {
        conflicts.push({ package: pkg, versions });
      }
      resolvedDeps[pkg] = versions[versions.length - 1];
    }
    for (const [pkg, versions] of Object.entries(aggregatedDevDeps)) {
      if (versions.length > 1 && !conflicts.some((c) => c.package === pkg)) {
        conflicts.push({ package: pkg, versions });
      }
      resolvedDevDeps[pkg] = versions[versions.length - 1];
    }
    const pkgJsonPath = path7.join(projectRoot, "package.json");
    let updated = false;
    if (fs5.existsSync(pkgJsonPath)) {
      const pkgContent = JSON.parse(fs5.readFileSync(pkgJsonPath, "utf8"));
      pkgContent.dependencies = pkgContent.dependencies || {};
      pkgContent.devDependencies = pkgContent.devDependencies || {};
      let hasChanges = false;
      for (const [pkg, ver] of Object.entries(resolvedDeps)) {
        if (pkgContent.dependencies[pkg] !== ver) {
          pkgContent.dependencies[pkg] = ver;
          hasChanges = true;
        }
      }
      for (const [pkg, ver] of Object.entries(resolvedDevDeps)) {
        if (!pkgContent.dependencies[pkg] && pkgContent.devDependencies[pkg] !== ver) {
          pkgContent.devDependencies[pkg] = ver;
          hasChanges = true;
        }
      }
      if (hasChanges && writeChanges) {
        fs5.writeFileSync(pkgJsonPath, JSON.stringify(pkgContent, null, 2) + "\n");
        updated = true;
        console.log(`[KrnlPackageReconciler] Reconciled package.json from ${manifests.length} manifest(s).`);
      }
    }
    return {
      updated,
      totalManifests: manifests.length,
      addedDependencies: resolvedDeps,
      addedDevDependencies: resolvedDevDeps,
      conflicts
    };
  }
  /**
   * Discovers all manifest.json files in krnl/ (or src/)
   */
  static findManifests(projectRoot) {
    const searchDirs = [
      path7.join(projectRoot, "krnl", "backend", "libraries"),
      path7.join(projectRoot, "krnl", "backend", "functionalities"),
      path7.join(projectRoot, "krnl", "frontend", "libraries"),
      path7.join(projectRoot, "krnl", "frontend", "functionalities"),
      path7.join(projectRoot, "src", "functionalities"),
      path7.join(projectRoot, "src", "libraries")
    ];
    const found = [];
    for (const dir of searchDirs) {
      if (fs5.existsSync(dir)) {
        this.scanRecursive(dir, found);
      }
    }
    return found;
  }
  static scanRecursive(dir, found) {
    try {
      const entries = fs5.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".git") continue;
        const full = path7.join(dir, entry.name);
        if (entry.isDirectory()) {
          this.scanRecursive(full, found);
        } else if (entry.isFile() && entry.name === "manifest.json") {
          found.push(full);
        }
      }
    } catch {
    }
  }
};

// src/commands/generators/functionalityGenerator.ts
function generateFunctionality(name, projectRoot) {
  const { backend, frontend } = getPlaneRoots(projectRoot);
  const bFuncDir = path8.join(backend, "functionalities", name);
  fs6.mkdirSync(path8.join(bFuncDir, "main_function"), { recursive: true });
  fs6.mkdirSync(path8.join(bFuncDir, "state_data"), { recursive: true });
  fs6.mkdirSync(path8.join(bFuncDir, "helper_functions"), { recursive: true });
  fs6.mkdirSync(path8.join(bFuncDir, "events"), { recursive: true });
  fs6.mkdirSync(path8.join(bFuncDir, "tests"), { recursive: true });
  fs6.writeFileSync(
    path8.join(bFuncDir, `${name}Atom.ts`),
    `export interface ${name}Input {
  payload?: string;
}

export interface ${name}Output {
  success: boolean;
  timestamp: number;
}
`
  );
  fs6.writeFileSync(
    path8.join(bFuncDir, "manifest.json"),
    JSON.stringify(
      {
        name,
        description: `${name} quad-unit functionality`,
        dependencies: {}
      },
      null,
      2
    )
  );
  fs6.writeFileSync(
    path8.join(bFuncDir, "main_function", "logic.ts"),
    `import type { ${name}Input, ${name}Output } from "../${name}Atom.js";

export const main = async (input: ${name}Input, { state }: any): Promise<${name}Output> => {
  return {
    success: true,
    timestamp: Date.now()
  };
};
`
  );
  fs6.writeFileSync(
    path8.join(bFuncDir, "main_function", "lifecycle.ts"),
    `export async function onMount() {}
export async function onTeardown() {}
`
  );
  fs6.writeFileSync(
    path8.join(bFuncDir, "state_data", "state.ts"),
    `export interface ${name}State {
  executionCount: number;
}

export const initialState: ${name}State = {
  executionCount: 0
};
`
  );
  fs6.writeFileSync(
    path8.join(bFuncDir, "helper_functions", "helper.ts"),
    `/**
 * @role component
 */
export function exampleHelper(): boolean {
  return true;
}
`
  );
  fs6.writeFileSync(
    path8.join(bFuncDir, "events", "events.ts"),
    `/**
 * @role component
 */
export interface ${name}CompletedEvent {
  timestamp: number;
}
`
  );
  fs6.writeFileSync(
    path8.join(bFuncDir, "tests", `${name}.test.ts`),
    `import { describe, it, expect } from "vitest";

describe("${name} functionality", () => {
  it("passes basic test", () => {
    expect(true).toBe(true);
  });
});
`
  );
  const fFuncDir = path8.join(frontend, "functionalities", name);
  fs6.mkdirSync(path8.join(fFuncDir, "tests"), { recursive: true });
  fs6.writeFileSync(
    path8.join(fFuncDir, `${name}0.tsx`),
    `import React from "react";

export const ${name}0: React.FC = () => {
  return (
    <div className="krnl-func-${name.toLowerCase()}">
      <h3>${name} (Variant 0)</h3>
    </div>
  );
};

export default ${name}0;
`
  );
  fs6.writeFileSync(
    path8.join(fFuncDir, "manifest.json"),
    JSON.stringify({ name: `${name}UI`, dependencies: {} }, null, 2)
  );
  fs6.writeFileSync(
    path8.join(fFuncDir, "tests", `${name}0.test.tsx`),
    `import { describe, it, expect } from "vitest";

describe("${name}0 Component", () => {
  it("renders correctly", () => {
    expect(true).toBe(true);
  });
});
`
  );
  KrnlPackageReconciler.reconcile(projectRoot, true);
  console.log(`\u2705 Created Backend Functionality Quad-Unit: krnl/backend/functionalities/${name}/`);
  console.log(`\u2705 Created Frontend Functionality: krnl/frontend/functionalities/${name}/`);
}

// src/commands/generators/libraryGenerator.ts
var fs7 = __toESM(require("fs"), 1);
var path9 = __toESM(require("path"), 1);
function generateLibrary(name, projectRoot) {
  const { backend, frontend } = getPlaneRoots(projectRoot);
  const conceptName = name.endsWith("Concepts") ? name : `${name}Concepts`;
  const bLibDir = path9.join(backend, "libraries", conceptName);
  fs7.mkdirSync(path9.join(bLibDir, "tests"), { recursive: true });
  fs7.writeFileSync(
    path9.join(bLibDir, "definitions.ts"),
    `/**
 * @file definitions.ts
 * @role component
 */
export interface ${conceptName}Options {
  enabled?: boolean;
}
`
  );
  fs7.writeFileSync(
    path9.join(bLibDir, "functions.ts"),
    `/**
 * @file functions.ts
 * @role component
 */
import type { ${conceptName}Options } from "./definitions.js";

export function ${name.toLowerCase()}Transform<T>(data: T, _opts?: ${conceptName}Options): T {
  return data;
}
`
  );
  fs7.writeFileSync(
    path9.join(bLibDir, "manifest.json"),
    JSON.stringify({ name: conceptName, dependencies: {} }, null, 2)
  );
  fs7.writeFileSync(
    path9.join(bLibDir, "tests", `${conceptName}.test.ts`),
    `import { describe, it, expect } from "vitest";

describe("${conceptName}", () => {
  it("runs correctly", () => {
    expect(true).toBe(true);
  });
});
`
  );
  const fLibDir = path9.join(frontend, "libraries", conceptName);
  fs7.mkdirSync(path9.join(fLibDir, "tests"), { recursive: true });
  fs7.writeFileSync(
    path9.join(fLibDir, "definitions.ts"),
    `export interface ${name}Props {
  label?: string;
}
`
  );
  fs7.writeFileSync(
    path9.join(fLibDir, "components.tsx"),
    `import React from "react";
import type { ${name}Props } from "./definitions.js";
import "./styles.css";

export const ${name}: React.FC<${name}Props> = ({ label = "${name}" }) => {
  return <div className="krnl-${name.toLowerCase()}">{label}</div>;
};
`
  );
  fs7.writeFileSync(
    path9.join(fLibDir, "styles.css"),
    `.krnl-${name.toLowerCase()} {
  font-family: inherit;
}
`
  );
  fs7.writeFileSync(
    path9.join(fLibDir, "manifest.json"),
    JSON.stringify({ name: `${conceptName}UI`, dependencies: {} }, null, 2)
  );
  fs7.writeFileSync(
    path9.join(fLibDir, "tests", `${name}.test.tsx`),
    `import { describe, it, expect } from "vitest";

describe("${name} UI Concept", () => {
  it("renders correctly", () => {
    expect(true).toBe(true);
  });
});
`
  );
  KrnlPackageReconciler.reconcile(projectRoot, true);
  console.log(`\u2705 Created Backend Concept Library: krnl/backend/libraries/${conceptName}/`);
  console.log(`\u2705 Created Frontend Concept Library: krnl/frontend/libraries/${conceptName}/`);
}

// src/commands/generate.ts
async function runGenerate(type, name, _parentEntity, projectRoot = process.cwd()) {
  if (!name) {
    console.error("\u274C Error: Resource name is required. Usage: krnl generate <entity|functionality|library> <Name>");
    process.exit(1);
  }
  switch (type.toLowerCase()) {
    case "entity":
      generateEntity(name, projectRoot);
      break;
    case "functionality":
      generateFunctionality(name, projectRoot);
      break;
    case "library":
      generateLibrary(name, projectRoot);
      break;
    default:
      console.error(`\u274C Unknown resource type "${type}". Valid types: entity, functionality, library`);
      process.exit(1);
  }
}

// src/commands/watch.ts
var fs8 = __toESM(require("fs"), 1);
var path10 = __toESM(require("path"), 1);
function generateMagneticDeclarations(projectRoot = process.cwd()) {
  const { results: functionalities, libDirs } = scanDirectory(projectRoot);
  let dtsContent = `// Automatically generated by Krnl Magnetic Watcher. Do not edit manually.

`;
  dtsContent += `import { Entity } from '@ultrst-armada/krnl-core';

`;
  const globalDeclarations = [];
  for (const func of functionalities) {
    const helpersDir = path10.join(func.funcPath, "helper_functions");
    if (fs8.existsSync(helpersDir)) {
      const files = fs8.readdirSync(helpersDir);
      for (const file of files) {
        if (file.endsWith(".js") || file.endsWith(".ts")) {
          const filePath = path10.join(helpersDir, file);
          const baseName = path10.basename(file, path10.extname(file));
          const importPath = `./${path10.relative(projectRoot, filePath).replace(/\\/g, "/")}`;
          const { named, hasDefault } = parseExports(filePath, baseName);
          if (hasDefault) {
            globalDeclarations.push(`  const ${baseName}: typeof import('${importPath}')['default'];`);
          }
          for (const name of named) {
            globalDeclarations.push(`  const ${name}: typeof import('${importPath}')['${name}'];`);
          }
        }
      }
    }
    const eventsDir = path10.join(func.funcPath, "events");
    if (fs8.existsSync(eventsDir)) {
      const files = fs8.readdirSync(eventsDir);
      for (const file of files) {
        if (file.endsWith(".js") || file.endsWith(".ts")) {
          const filePath = path10.join(eventsDir, file);
          const baseName = path10.basename(file, path10.extname(file));
          const importPath = `./${path10.relative(projectRoot, filePath).replace(/\\/g, "/")}`;
          const { named, hasDefault } = parseExports(filePath, baseName);
          if (hasDefault) {
            globalDeclarations.push(`  const ${baseName}: typeof import('${importPath}')['default'];`);
          }
          for (const name of named) {
            globalDeclarations.push(`  const ${name}: typeof import('${importPath}')['${name}'];`);
          }
        }
      }
    }
  }
  for (const libPath of libDirs) {
    scanLibFiles(libPath, projectRoot, globalDeclarations);
  }
  if (globalDeclarations.length > 0) {
    dtsContent += `declare global {
${Array.from(new Set(globalDeclarations)).join("\n")}
}
`;
  }
  const outPath = path10.join(projectRoot, "krnl-magnetic.d.ts");
  fs8.writeFileSync(outPath, dtsContent);
  console.log(`[Krnl Watch] Updated ambient declarations: ${outPath}`);
}
function scanLibFiles(dir, projectRoot, decls) {
  if (!fs8.existsSync(dir)) return;
  for (const entry of fs8.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
    const full = path10.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanLibFiles(full, projectRoot, decls);
    } else if ((entry.name.endsWith(".ts") || entry.name.endsWith(".js")) && !entry.name.endsWith(".d.ts")) {
      const baseName = path10.basename(entry.name, path10.extname(entry.name));
      const importPath = `./${path10.relative(projectRoot, full).replace(/\\/g, "/")}`;
      const { named, hasDefault } = parseExports(full, baseName);
      if (hasDefault) decls.push(`  const ${baseName}: typeof import('${importPath}')['default'];`);
      for (const n of named) decls.push(`  const ${n}: typeof import('${importPath}')['${n}'];`);
    }
  }
}
function scanDirectory(dir, results = [], libDirs = []) {
  if (!fs8.existsSync(dir)) return { results, libDirs };
  const list = fs8.readdirSync(dir, { withFileTypes: true });
  for (const entry of list) {
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".git") continue;
      const fullPath = path10.join(dir, entry.name);
      if (entry.name === "functionalities") {
        const funcs = fs8.readdirSync(fullPath, { withFileTypes: true });
        for (const f of funcs) {
          if (f.isDirectory()) results.push({ funcPath: path10.join(fullPath, f.name), funcName: f.name });
        }
      } else if (entry.name === "libraries" || entry.name === "library") {
        libDirs.push(fullPath);
      } else {
        scanDirectory(fullPath, results, libDirs);
      }
    }
  }
  return { results, libDirs };
}
function parseExports(filePath, defaultName) {
  const content = fs8.readFileSync(filePath, "utf8");
  const named = [];
  let hasDefault = false;
  const namedRegex = /export\s+(?:const|let|var|function|class|async\s+function)\s+([a-zA-Z0-9_$]+)/g;
  let match;
  while ((match = namedRegex.exec(content)) !== null) {
    if (match[1]) named.push(match[1]);
  }
  if (content.includes("export default")) {
    hasDefault = true;
  }
  return { named, hasDefault };
}

// src/commands/build.ts
var path11 = __toESM(require("path"), 1);
var fs9 = __toESM(require("fs"), 1);
var import_child_process = require("child_process");
async function runBuild(projectRoot = process.cwd(), options = {}) {
  KrnlPackageReconciler.reconcile(projectRoot, true);
  if (options.entity) {
    console.log(`\u{1F3D7}\uFE0F  [Krnl Build] Target entity variant: "${options.entity}"`);
  } else if (options.all) {
    console.log(`\u{1F3D7}\uFE0F  [Krnl Build] Combined multi-entity build`);
  }
  console.log("\u{1F50D} [Krnl Build] Running AST & layer purity validation...");
  const valid = await runValidate(projectRoot);
  if (!valid) {
    console.error("\u274C [Krnl Build] Build aborted due to validation errors.");
    return { success: false, error: "Validation failed" };
  }
  generateMagneticDeclarations(projectRoot);
  const tsConfigPath = path11.join(projectRoot, "tsconfig.json");
  if (fs9.existsSync(tsConfigPath)) {
    console.log("\u{1F3D7}\uFE0F  [Krnl Build] Compiling TypeScript source files to dist/...");
    const localTsc = path11.join(projectRoot, "node_modules", ".bin", "tsc");
    const tscCmd = fs9.existsSync(localTsc) ? localTsc : "tsc";
    try {
      (0, import_child_process.execSync)(`${tscCmd} -p tsconfig.json`, { cwd: projectRoot, stdio: "inherit" });
    } catch (err) {
      console.error("\u274C [Krnl Build] TypeScript compilation failed.");
      return { success: false, error: "TypeScript compilation failed" };
    }
  } else {
    console.log("\u2139\uFE0F  [Krnl Build] No tsconfig.json found; skipping TypeScript compiler invocation.");
  }
  console.log("\u2705 [Krnl Build] Project validation, declaration generation, and compilation completed successfully.");
  return { success: true };
}

// src/commands/dev.ts
var http = __toESM(require("http"), 1);
var path12 = __toESM(require("path"), 1);
var fs10 = __toESM(require("fs"), 1);
async function runDev(projectRoot = process.cwd(), options = {}) {
  const port = options.port ?? 8080;
  KrnlPackageReconciler.reconcile(projectRoot, true);
  generateMagneticDeclarations(projectRoot);
  if (options.dryRun) {
    console.log(`\u26A1 [Krnl Dev] Development environment verified on port ${port} (--dry-run).`);
    return {
      port,
      close: async () => {
      }
    };
  }
  const server = http.createServer((req, res) => {
    res.setHeader("Content-Type", "application/json");
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    if (url.pathname === "/" || url.pathname === "/health") {
      res.writeHead(200);
      res.end(JSON.stringify({ status: "ok", service: "krnl-dev", port, uptime: process.uptime() }));
      return;
    }
    if (url.pathname === "/manifest") {
      const pkgPath = path12.join(projectRoot, "package.json");
      const pkg = fs10.existsSync(pkgPath) ? JSON.parse(fs10.readFileSync(pkgPath, "utf8")) : {};
      res.writeHead(200);
      res.end(JSON.stringify({ name: pkg.name || "krnl-app", version: pkg.version || "1.0.0" }));
      return;
    }
    res.writeHead(404);
    res.end(JSON.stringify({ error: "Route not found" }));
  });
  await new Promise((resolve2, reject) => {
    server.listen(port, () => resolve2());
    server.on("error", reject);
  });
  console.log(`\u26A1 [Krnl Dev] Development server listening on http://localhost:${port}`);
  const watcher = fs10.watch(projectRoot, { recursive: true }, (_evt, filename) => {
    if (filename && (filename.endsWith(".ts") || filename.endsWith(".js")) && !filename.includes("krnl-magnetic.d.ts")) {
      try {
        generateMagneticDeclarations(projectRoot);
      } catch {
      }
    }
    if (filename && filename.endsWith("manifest.json")) {
      try {
        KrnlPackageReconciler.reconcile(projectRoot, true);
      } catch {
      }
    }
  });
  const close = async () => {
    watcher.close();
    await new Promise((resolve2) => server.close(() => resolve2()));
  };
  return { server, close, port };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  generateMagneticDeclarations,
  runBuild,
  runDev,
  runGenerate,
  runValidate
});
