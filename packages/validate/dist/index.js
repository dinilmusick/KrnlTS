// src/KrnlValidatorEngine.ts
import * as fs from "fs";
import * as path from "path";
import { Project, SyntaxKind } from "ts-morph";
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
      this.project = new Project({ tsConfigFilePath: tsConfigPath, skipAddingFilesFromTsConfig: true });
    } else {
      this.project = new Project({ compilerOptions: {
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
        message: `File exceeds maximum length of ${this.maxFileLineLimit} lines (currently ${lines.length} lines). Decompose into sub-components, custom hooks, quad-units, or concept libraries.`,
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
    const isUiTopLevel = /^(App|main|index|_app|root)\.(tsx|jsx)$/i.test(baseName);
    const isBackendTopLevel = /^(server|app)\.(ts|js)$/i.test(baseName) && (!filePath.includes("/components/") && !filePath.includes("/entities/") && !filePath.includes("/libraries/"));
    if (isUiTopLevel) {
      const jsxElements = sf.getDescendantsOfKind(SyntaxKind.JsxOpeningElement);
      const jsxSelfClosing = sf.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement);
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
      const calls2 = sf.getDescendantsOfKind(SyntaxKind.CallExpression);
      for (const call of calls2) {
        const exprText = call.getExpression().getText();
        if (["useState", "useEffect", "useRef", "useMemo", "useCallback", "useReducer", "useContext", "useLayoutEffect"].includes(exprText) || /^use[A-Z]/.test(exprText) && exprText !== "use") {
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
      const calls2 = sf.getDescendantsOfKind(SyntaxKind.CallExpression);
      for (const call of calls2) {
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
    if (filePath.endsWith(".tsx") || filePath.endsWith(".jsx")) {
      const componentNames = [];
      for (const fn of sf.getFunctions()) {
        const name = fn.getName();
        if (name && /^[A-Z]/.test(name)) {
          const hasJsx = fn.getDescendantsOfKind(SyntaxKind.JsxElement).length > 0 || fn.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement).length > 0 || fn.getDescendantsOfKind(SyntaxKind.JsxFragment).length > 0;
          if (hasJsx) {
            componentNames.push(name);
          }
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
              const hasJsx = init.getDescendantsOfKind(SyntaxKind.JsxElement).length > 0 || init.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement).length > 0 || init.getDescendantsOfKind(SyntaxKind.JsxFragment).length > 0;
              if (isFcType || hasJsx) {
                if (!componentNames.includes(name)) {
                  componentNames.push(name);
                }
              }
            }
          }
        }
      }
      for (const cls of sf.getClasses()) {
        const name = cls.getName();
        const ext = cls.getExtends()?.getText() || "";
        if (name && (ext.includes("Component") || ext.includes("PureComponent"))) {
          if (!componentNames.includes(name)) {
            componentNames.push(name);
          }
        }
      }
      if (componentNames.length > 1) {
        errors.push({
          ruleId: "krnl/one-component-per-file",
          filePath,
          message: `File '${baseName}' defines multiple React components (${componentNames.join(", ")}). Krnl strictly enforces ONE component per file. Decompose into sub-component files.`,
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
    const calls = sf.getDescendantsOfKind(SyntaxKind.CallExpression);
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
      } else if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".js") || entry.name.endsWith(".tsx") || entry.name.endsWith(".jsx"))) {
        collected.push(full);
      }
    }
    return collected;
  }
};
export {
  KrnlValidatorEngine
};
