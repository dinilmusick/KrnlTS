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
  runGenerate: () => runGenerate,
  runValidate: () => runValidate
});
module.exports = __toCommonJS(index_exports);

// ../validate/dist/index.js
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
      const jsxElements = sf.getDescendantsOfKind(import_ts_morph.SyntaxKind.JsxOpeningElement);
      const jsxSelfClosing = sf.getDescendantsOfKind(import_ts_morph.SyntaxKind.JsxSelfClosingElement);
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
      const calls2 = sf.getDescendantsOfKind(import_ts_morph.SyntaxKind.CallExpression);
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
      const calls2 = sf.getDescendantsOfKind(import_ts_morph.SyntaxKind.CallExpression);
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
          const hasJsx = fn.getDescendantsOfKind(import_ts_morph.SyntaxKind.JsxElement).length > 0 || fn.getDescendantsOfKind(import_ts_morph.SyntaxKind.JsxSelfClosingElement).length > 0 || fn.getDescendantsOfKind(import_ts_morph.SyntaxKind.JsxFragment).length > 0;
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
              const hasJsx = init.getDescendantsOfKind(import_ts_morph.SyntaxKind.JsxElement).length > 0 || init.getDescendantsOfKind(import_ts_morph.SyntaxKind.JsxSelfClosingElement).length > 0 || init.getDescendantsOfKind(import_ts_morph.SyntaxKind.JsxFragment).length > 0;
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

// src/commands/generate.ts
var fs2 = __toESM(require("fs"), 1);
var path2 = __toESM(require("path"), 1);
async function runGenerate(type, name, parentEntity, projectRoot = process.cwd()) {
  if (!name) {
    console.error("\u274C Error: Resource name is required. Usage: krnl generate <entity|functionality|library|subapp> <Name> [ParentEntity]");
    process.exit(1);
  }
  switch (type.toLowerCase()) {
    case "entity":
      generateEntity(name, projectRoot);
      break;
    case "functionality":
      if (!parentEntity) {
        console.error("\u274C Error: Parent entity name is required for functionality. Usage: krnl generate functionality <Name> <ParentEntity>");
        process.exit(1);
      }
      generateFunctionality(name, parentEntity, projectRoot);
      break;
    case "library":
      generateLibrary(name, projectRoot);
      break;
    case "subapp":
      generateSubApp(name, projectRoot);
      break;
    default:
      console.error(`\u274C Unknown resource type '${type}'. Valid types: entity, functionality, library, subapp`);
      process.exit(1);
  }
}
function generateEntity(name, projectRoot) {
  const entityDir = path2.join(projectRoot, "src", "entities", name);
  fs2.mkdirSync(entityDir, { recursive: true });
  fs2.mkdirSync(path2.join(entityDir, "functionalities"), { recursive: true });
  const entityFile = path2.join(entityDir, `${name}.ts`);
  const content = `import { Entity, KrnlMagneticLoader } from '@dinilmusick/krnl-core';

export class ${name} extends Entity {
  constructor() {
    super({
      id: '${name}',
      version: '1.0.0',
      description: '${name} root entity'
    });
  }

  async boot(): Promise<void> {
    // 1. Local functionalities with UI must precede loadAll
    
    // 2. Discover magnetic functionalities, child entities, and subapps
    await KrnlMagneticLoader.loadAll(this, import.meta.url);
  }
}

export default ${name};
`;
  fs2.writeFileSync(entityFile, content);
  console.log(`\u2705 Created Entity: src/entities/${name}/${name}.ts`);
}
function generateFunctionality(name, entityName, projectRoot) {
  const funcDir = path2.join(projectRoot, "src", "entities", entityName, "functionalities", name);
  fs2.mkdirSync(path2.join(funcDir, "main_function"), { recursive: true });
  fs2.mkdirSync(path2.join(funcDir, "state_data"), { recursive: true });
  fs2.mkdirSync(path2.join(funcDir, "helper_functions"), { recursive: true });
  fs2.mkdirSync(path2.join(funcDir, "events"), { recursive: true });
  fs2.writeFileSync(path2.join(funcDir, `${name}Atom.ts`), `export interface ${name}Input {
  message?: string;
}

export interface ${name}Output {
  success: boolean;
  timestamp: number;
}
`);
  fs2.writeFileSync(path2.join(funcDir, "main_function", "logic.ts"), `import { ${name}Input, ${name}Output } from '../${name}Atom.js';
import { formatTimestamp } from '../helper_functions/formatTimestamp.js';

export const main = async (input: ${name}Input, { state, entity }: any): Promise<${name}Output> => {
  const timestamp = formatTimestamp();
  return {
    success: true,
    timestamp
  };
};
`);
  fs2.writeFileSync(path2.join(funcDir, "state_data", "state.ts"), `export interface ${name}State {
  executionCount: number;
}

export const initialState: ${name}State = {
  executionCount: 0
};
`);
  fs2.writeFileSync(path2.join(funcDir, "helper_functions", "formatTimestamp.ts"), `export function formatTimestamp(): number {
  return Date.now();
}
`);
  console.log(`\u2705 Created Quad-Unit Functionality: src/entities/${entityName}/functionalities/${name}/`);
}
function generateLibrary(name, projectRoot) {
  const libDir = path2.join(projectRoot, "src", "libraries");
  fs2.mkdirSync(libDir, { recursive: true });
  const fileName = `${name}Concepts.ts`;
  fs2.writeFileSync(path2.join(libDir, fileName), `/**
 * @file ${fileName}
 * @role component
 * @description Layer 0 pure domain concept library for ${name}.
 */

export class ${name}Concepts {
  static pureTransform<T>(data: T): T {
    return data;
  }
}
`);
  console.log(`\u2705 Created Domain Concept Library: src/libraries/${fileName}`);
}
function generateSubApp(name, projectRoot) {
  const subappDir = path2.join(projectRoot, "src", "subapps", name);
  fs2.mkdirSync(subappDir, { recursive: true });
  fs2.writeFileSync(path2.join(subappDir, "subapp.json"), JSON.stringify({
    name,
    version: "1.0.0",
    description: `${name} self-contained sub-app`,
    registrationEntry: "./register.js"
  }, null, 2));
  fs2.writeFileSync(path2.join(subappDir, "register.ts"), `export function register(context: any) {
  context.logger.log('Registering ${name} sub-app');
  return {
    name: '${name}',
    operations: []
  };
}
export default register;
`);
  console.log(`\u2705 Created Sub-App: src/subapps/${name}/`);
}

// src/commands/watch.ts
var fs3 = __toESM(require("fs"), 1);
var path3 = __toESM(require("path"), 1);
function generateMagneticDeclarations(projectRoot = process.cwd()) {
  const functionalities = scanDirectory(projectRoot);
  let dtsContent = `// Automatically generated by Krnl Magnetic Watcher. Do not edit manually.

`;
  dtsContent += `import { Entity } from '@dinilmusick/krnl-core';

`;
  const globalDeclarations = [];
  for (const func of functionalities) {
    const helpersDir = path3.join(func.funcPath, "helper_functions");
    if (fs3.existsSync(helpersDir)) {
      const files = fs3.readdirSync(helpersDir);
      for (const file of files) {
        if (file.endsWith(".js") || file.endsWith(".ts")) {
          const filePath = path3.join(helpersDir, file);
          const baseName = path3.basename(file, path3.extname(file));
          const importPath = `./${path3.relative(projectRoot, filePath).replace(/\\/g, "/")}`;
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
    const eventsDir = path3.join(func.funcPath, "events");
    if (fs3.existsSync(eventsDir)) {
      const files = fs3.readdirSync(eventsDir);
      for (const file of files) {
        if (file.endsWith(".js") || file.endsWith(".ts")) {
          const filePath = path3.join(eventsDir, file);
          const baseName = path3.basename(file, path3.extname(file));
          const importPath = `./${path3.relative(projectRoot, filePath).replace(/\\/g, "/")}`;
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
  if (globalDeclarations.length > 0) {
    dtsContent += `declare global {
${Array.from(new Set(globalDeclarations)).join("\n")}
}
`;
  }
  const outPath = path3.join(projectRoot, "krnl-magnetic.d.ts");
  fs3.writeFileSync(outPath, dtsContent);
  console.log(`[Krnl Watch] Updated ambient declarations: ${outPath}`);
}
function scanDirectory(dir, results = []) {
  if (!fs3.existsSync(dir)) return results;
  const list = fs3.readdirSync(dir, { withFileTypes: true });
  for (const entry of list) {
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".git") continue;
      const fullPath = path3.join(dir, entry.name);
      if (entry.name === "functionalities") {
        const funcs = fs3.readdirSync(fullPath, { withFileTypes: true });
        for (const f of funcs) {
          if (f.isDirectory()) {
            results.push({ funcPath: path3.join(fullPath, f.name), funcName: f.name });
          }
        }
      } else {
        scanDirectory(fullPath, results);
      }
    }
  }
  return results;
}
function parseExports(filePath, defaultName) {
  const content = fs3.readFileSync(filePath, "utf8");
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  generateMagneticDeclarations,
  runGenerate,
  runValidate
});
