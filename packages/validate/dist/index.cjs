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
var fs2 = __toESM(require("fs"), 1);
var path3 = __toESM(require("path"), 1);
var import_ts_morph4 = require("ts-morph");

// src/rules/fileLimits.ts
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

// src/rules/componentRules.ts
var path = __toESM(require("path"), 1);
var import_ts_morph = require("ts-morph");
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
        const hasJsx = fn.getDescendantsOfKind(import_ts_morph.SyntaxKind.JsxElement).length > 0 || fn.getDescendantsOfKind(import_ts_morph.SyntaxKind.JsxSelfClosingElement).length > 0 || fn.getDescendantsOfKind(import_ts_morph.SyntaxKind.JsxFragment).length > 0;
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
            const hasJsx = init.getDescendantsOfKind(import_ts_morph.SyntaxKind.JsxElement).length > 0 || init.getDescendantsOfKind(import_ts_morph.SyntaxKind.JsxSelfClosingElement).length > 0 || init.getDescendantsOfKind(import_ts_morph.SyntaxKind.JsxFragment).length > 0;
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
          message: `Helper functions (Layer 1) cannot directly import I/O modules ('${spec}'). Delegate to Layer 0 libraries or ServiceFacade context.`,
          severity: "error"
        });
      }
    }
  }
  return { errors, warnings };
}

// src/rules/orchestrationRules.ts
var import_ts_morph2 = require("ts-morph");
function checkOrchestrationRules(sf) {
  const errors = [];
  const warnings = [];
  const filePath = sf.getFilePath();
  const sourceText = sf.getText();
  const calls = sf.getDescendantsOfKind(import_ts_morph2.SyntaxKind.CallExpression);
  for (const call of calls) {
    const exprText = call.getExpression().getText();
    if (exprText === "setInterval" || exprText === "window.setInterval") {
      errors.push({
        ruleId: "krnl/no-polling",
        filePath,
        line: call.getStartLineNumber(),
        message: `Prohibited use of 'setInterval'. Krnl applications must use reactive event streams or triggers.`,
        severity: "error"
      });
    }
  }
  if (sourceText.includes("main = async") || sourceText.includes("export const main = async")) {
    const match = sourceText.match(/main\s*=\s*async\s*\([^,]+,\s*\{([^}]*)\}\s*\)/);
    if (match) {
      const destructured = match[1];
      if (/\bsystem\b/.test(destructured)) {
        errors.push({
          ruleId: "krnl/context-destructuring",
          filePath,
          message: `Functionality context parameter destructures 'system'. Functionality passes { state, orchestration } or service context.`,
          severity: "error"
        });
      }
    }
  }
  const isOrchestrationClass = sf.getClasses().some((c) => {
    const ext = c.getExtends();
    return ext && (ext.getText().includes("FunctionalityOrchestration") || ext.getText().includes("Orchestration") || ext.getText().includes("krnlOrchestrationBase"));
  });
  if (isOrchestrationClass) {
    for (const decl of sf.getImportDeclarations()) {
      const spec = decl.getModuleSpecifierValue();
      if (spec.includes("libraries/") || spec.includes("Concepts")) {
        errors.push({
          ruleId: "krnl/orchestration-no-libraries",
          filePath,
          line: decl.getStartLineNumber(),
          message: `FunctionalityOrchestration class violates Library Calling Invariant. FunctionalityOrchestrations must not call or import libraries directly ('${spec}'). Only functionalities are permitted to call shared libraries.`,
          severity: "error"
        });
      }
    }
    for (const cls of sf.getClasses()) {
      const ext = cls.getExtends();
      if (ext && (ext.getText().includes("FunctionalityOrchestration") || ext.getText().includes("Orchestration") || ext.getText().includes("krnlOrchestrationBase"))) {
        const loops = [
          ...cls.getDescendantsOfKind(import_ts_morph2.SyntaxKind.ForStatement),
          ...cls.getDescendantsOfKind(import_ts_morph2.SyntaxKind.ForOfStatement),
          ...cls.getDescendantsOfKind(import_ts_morph2.SyntaxKind.ForInStatement),
          ...cls.getDescendantsOfKind(import_ts_morph2.SyntaxKind.WhileStatement),
          ...cls.getDescendantsOfKind(import_ts_morph2.SyntaxKind.DoStatement)
        ];
        for (const loop of loops) {
          errors.push({
            ruleId: "krnl/orchestration-purity",
            filePath,
            line: loop.getStartLineNumber(),
            message: `FunctionalityOrchestration '${cls.getName() || "Anonymous"}' violates Orchestration Purity Law. Loops and procedural algorithms are prohibited inside orchestrations. Move logic to a functionality or a global library function.`,
            severity: "error"
          });
        }
        const allowedMethods = /* @__PURE__ */ new Set([
          "flow",
          "getFlow",
          "listFlows",
          "clearFlows",
          "thenFunctionality",
          "parallel",
          "branch",
          "fanOut",
          "thenFunctionalityOrchestration",
          "getSteps",
          "assertServiceBoundary"
        ]);
        for (const method of cls.getMethods()) {
          const methodName = method.getName();
          if (!allowedMethods.has(methodName)) {
            errors.push({
              ruleId: "krnl/orchestration-purity",
              filePath,
              line: method.getStartLineNumber(),
              message: `FunctionalityOrchestration '${cls.getName() || "Anonymous"}' defines custom method '${methodName}'. FunctionalityOrchestrations are purely declarative compositors. Define capabilities as functionalities or global library functions.`,
              severity: "error"
            });
          }
        }
      }
    }
    for (const call of calls) {
      const callText = call.getText();
      if (callText.startsWith("this.flow(") || callText.startsWith("orchestration.flow(")) {
        let currentExpr = call;
        const chainCalls = [];
        while (currentExpr && import_ts_morph2.Node.isCallExpression(currentExpr)) {
          const propAccess = currentExpr.getExpression();
          if (import_ts_morph2.Node.isPropertyAccessExpression(propAccess)) {
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
          if (step.name === "flow") {
            chainId = step.argText ? step.argText.replace(/['"]/g, "") : "orchestration";
          } else if (step.name === "thenFunction") {
            errors.push({
              ruleId: "krnl/orchestration-no-direct-library-calls",
              filePath,
              line: step.node.getStartLineNumber(),
              message: `FunctionalityOrchestration flow '${chainId}' violates Orchestration Purity Law. Orchestrations cannot chain direct library functions via thenFunction(). Orchestrations must only sequence functionalities (thenFunctionality) and peer functionality orchestrations (thenFunctionalityOrchestration).`,
              severity: "error"
            });
          } else if (step.name === "thenService") {
            errors.push({
              ruleId: "krnl/orchestration-no-external-services",
              filePath,
              line: step.node.getStartLineNumber(),
              message: `FunctionalityOrchestration flow '${chainId}' violates Plane Isolation Law L1. A service-level FunctionalityOrchestration cannot compose external services. Use Skipo ServiceOrchestration at the application layer instead.`,
              severity: "error"
            });
          }
        }
      }
    }
  }
  return { errors, warnings };
}

// src/rules/workspaceRules.ts
var fs = __toESM(require("fs"), 1);
var path2 = __toESM(require("path"), 1);
var import_ts_morph3 = require("ts-morph");
function checkTopLevelPurity(sf) {
  const errors = [];
  const warnings = [];
  const filePath = sf.getFilePath();
  const baseName = path2.basename(filePath);
  const isUiTopLevel = /^(App|main|index|_app|root)\.(tsx|jsx)$/i.test(baseName);
  const isBackendTopLevel = /^(server|app|index)\.(ts|js)$/i.test(baseName) && !filePath.includes("/components/") && !filePath.includes("/orchestrations/") && !filePath.includes("/services/") && !filePath.includes("/libraries/");
  if (isUiTopLevel) {
    const jsxElements = sf.getDescendantsOfKind(import_ts_morph3.SyntaxKind.JsxOpeningElement);
    const jsxSelfClosing = sf.getDescendantsOfKind(import_ts_morph3.SyntaxKind.JsxSelfClosingElement);
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
    const calls = sf.getDescendantsOfKind(import_ts_morph3.SyntaxKind.CallExpression);
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
    const calls = sf.getDescendantsOfKind(import_ts_morph3.SyntaxKind.CallExpression);
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
  const krnlDir = path2.join(projectRoot, "krnl");
  const srcDir = path2.join(projectRoot, "src");
  const targetDir = fs.existsSync(krnlDir) ? krnlDir : fs.existsSync(srcDir) ? srcDir : null;
  if (!targetDir) return;
  const backendDir = path2.join(targetDir, "backend");
  const frontendDir = path2.join(targetDir, "frontend");
  if (fs.existsSync(backendDir)) {
    const bLibs = path2.join(backendDir, "libraries");
    if (fs.existsSync(bLibs)) {
      for (const entry of fs.readdirSync(bLibs, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const libPath = path2.join(bLibs, entry.name);
        if (!fs.existsSync(path2.join(libPath, "manifest.json"))) {
          errors.push({
            ruleId: "krnl/concept-manifest-required",
            filePath: libPath,
            message: `Backend concept library "${entry.name}" is missing a manifest.json file.`,
            severity: "error"
          });
        }
      }
    }
    const bFuncs = path2.join(backendDir, "functionalities");
    if (fs.existsSync(bFuncs)) {
      for (const entry of fs.readdirSync(bFuncs, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const funcPath = path2.join(bFuncs, entry.name);
        if (!fs.existsSync(path2.join(funcPath, "manifest.json"))) {
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
    const fLibs = path2.join(frontendDir, "libraries");
    if (fs.existsSync(fLibs)) {
      for (const entry of fs.readdirSync(fLibs, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const libPath = path2.join(fLibs, entry.name);
        if (!fs.existsSync(path2.join(libPath, "manifest.json"))) {
          errors.push({
            ruleId: "krnl/frontend-concept-manifest-required",
            filePath: libPath,
            message: `Frontend concept library "${entry.name}" is missing a manifest.json file.`,
            severity: "error"
          });
        }
      }
    }
    const fFuncs = path2.join(frontendDir, "functionalities");
    if (fs.existsSync(fFuncs)) {
      for (const entry of fs.readdirSync(fFuncs, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const funcPath = path2.join(fFuncs, entry.name);
        if (!fs.existsSync(path2.join(funcPath, "manifest.json"))) {
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

// src/KrnlValidatorEngine.ts
var KrnlValidatorEngine = class {
  project;
  projectRoot;
  limitOptions;
  constructor(optionsOrRoot) {
    const options = typeof optionsOrRoot === "string" ? { projectRoot: optionsOrRoot } : optionsOrRoot;
    this.projectRoot = path3.resolve(options.projectRoot || process.cwd());
    this.limitOptions = {
      maxFileLineLimit: options.maxFileLineLimit ?? 200,
      maxMainLogicLimit: options.maxMainLogicLimit ?? 20,
      maxHelperLineLimit: options.maxHelperLineLimit ?? 30
    };
    const tsConfigPath = path3.join(this.projectRoot, "tsconfig.json");
    if (fs2.existsSync(tsConfigPath)) {
      this.project = new import_ts_morph4.Project({ tsConfigFilePath: tsConfigPath, skipAddingFilesFromTsConfig: true });
    } else {
      this.project = new import_ts_morph4.Project({ compilerOptions: {
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
    const baseName = path3.basename(filePath);
    if (baseName.includes("_pb.") || baseName.endsWith(".d.ts")) {
      return { errors: [], warnings: [] };
    }
    const limits = checkFileLimits(sf, this.limitOptions);
    const purity = checkTopLevelPurity(sf);
    const components = checkComponentRules(sf);
    const orchestration = checkOrchestrationRules(sf);
    return {
      errors: [...limits.errors, ...purity.errors, ...components.errors, ...orchestration.errors],
      warnings: [...limits.warnings, ...purity.warnings, ...components.warnings, ...orchestration.warnings]
    };
  }
  collectSourceFiles(dir, collected = []) {
    if (!fs2.existsSync(dir)) return collected;
    const entries = fs2.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".git") continue;
      const full = path3.join(dir, entry.name);
      if (entry.isDirectory()) {
        this.collectSourceFiles(full, collected);
      } else if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".js") || entry.name.endsWith(".tsx") || entry.name.endsWith(".jsx"))) {
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
