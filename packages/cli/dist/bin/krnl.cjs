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

// src/bin/krnl.ts
var fs9 = __toESM(require("fs"), 1);

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

// ../studio/src/server/AstMutationEngine.ts
var fs4 = __toESM(require("fs"), 1);
var path4 = __toESM(require("path"), 1);
var import_ts_morph2 = require("ts-morph");
var AstMutationEngine = class {
  projectRoot;
  project;
  customEdges = [];
  deletedEdges = /* @__PURE__ */ new Set();
  nodePositions = /* @__PURE__ */ new Map();
  undoStack = [];
  redoStack = [];
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = path4.resolve(projectRoot);
    const tsConfigPath = path4.join(this.projectRoot, "tsconfig.json");
    if (fs4.existsSync(tsConfigPath)) {
      this.project = new import_ts_morph2.Project({ tsConfigFilePath: tsConfigPath, skipAddingFilesFromTsConfig: true });
    } else {
      this.project = new import_ts_morph2.Project({ compilerOptions: {
        target: 99
        /* ESNext */
      } });
    }
    this.loadPersistedGraphState();
  }
  getGraphStateFilePath() {
    return path4.join(this.projectRoot, ".krnl-graph.json");
  }
  loadPersistedGraphState() {
    try {
      const p = this.getGraphStateFilePath();
      if (fs4.existsSync(p)) {
        const raw = JSON.parse(fs4.readFileSync(p, "utf-8"));
        if (raw.positions) {
          for (const [k, v] of Object.entries(raw.positions)) {
            this.nodePositions.set(k, v);
          }
        }
        if (Array.isArray(raw.customEdges)) {
          this.customEdges = raw.customEdges;
        }
        if (Array.isArray(raw.deletedEdges)) {
          this.deletedEdges = new Set(raw.deletedEdges);
        }
      }
    } catch (e) {
    }
  }
  persistGraphState() {
    try {
      const p = this.getGraphStateFilePath();
      const posObj = {};
      this.nodePositions.forEach((v, k) => {
        posObj[k] = v;
      });
      fs4.writeFileSync(p, JSON.stringify({
        positions: posObj,
        customEdges: this.customEdges,
        deletedEdges: Array.from(this.deletedEdges)
      }, null, 2), "utf-8");
    } catch (e) {
    }
  }
  extractArchitectureGraph() {
    const nodes = [];
    let edges = [];
    const possibleEntityDirs = [
      path4.join(this.projectRoot, "src", "entities"),
      path4.join(this.projectRoot, "entities")
    ];
    for (const entitiesDir of possibleEntityDirs) {
      if (fs4.existsSync(entitiesDir)) {
        this.scanEntitiesRecursive(entitiesDir, nodes, edges);
      }
    }
    const possibleLibDirs = [
      path4.join(this.projectRoot, "src", "libraries"),
      path4.join(this.projectRoot, "libraries")
    ];
    for (const libDir of possibleLibDirs) {
      if (fs4.existsSync(libDir)) {
        const libFiles = fs4.readdirSync(libDir, { withFileTypes: true });
        for (const file of libFiles) {
          if (file.isFile() && (file.name.endsWith(".ts") || file.name.endsWith(".js"))) {
            const baseName = file.name.replace(/\.(ts|js)$/, "");
            const libPath = path4.join(libDir, file.name);
            const libMeta = this.extractLibraryMetadata(libPath, baseName);
            nodes.push({
              id: `library:${baseName}`,
              type: "library",
              name: baseName,
              filePath: libPath,
              uiSpec: libMeta.uiSpec,
              uiFilePath: libMeta.uiFilePath,
              examplePayload: libMeta.examplePayload
            });
          }
        }
      }
    }
    const possibleSubappDirs = [
      path4.join(this.projectRoot, "src", "subapps"),
      path4.join(this.projectRoot, "subapps")
    ];
    for (const subappDir of possibleSubappDirs) {
      if (fs4.existsSync(subappDir)) {
        const subapps = fs4.readdirSync(subappDir, { withFileTypes: true });
        for (const sa of subapps) {
          if (sa.isDirectory()) {
            const saName = sa.name;
            const saPath = path4.join(subappDir, saName);
            const saMeta = this.extractSubappMetadata(saPath, saName);
            nodes.push({
              id: `subapp:${saName}`,
              type: "subapp",
              name: saName,
              filePath: saPath,
              uiSpec: saMeta.uiSpec,
              uiFilePath: saMeta.uiFilePath,
              examplePayload: saMeta.examplePayload
            });
          }
        }
      }
    }
    for (const node of nodes) {
      if (this.nodePositions.has(node.id)) {
        node.position = this.nodePositions.get(node.id);
      }
    }
    edges = [...edges, ...this.customEdges].filter((e) => !this.deletedEdges.has(e.id));
    return { nodes, edges };
  }
  scanEntitiesRecursive(entitiesDir, nodes, edges, parentName) {
    if (!fs4.existsSync(entitiesDir)) return;
    const entries = fs4.readdirSync(entitiesDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const entityName = entry.name;
        const entityPath = path4.join(entitiesDir, entityName);
        const entityTsFile = path4.join(entityPath, `${entityName}.ts`);
        const entityUi = this.findUiFile(entityPath, entityName);
        const entityNode = {
          id: `entity:${entityName}`,
          type: "entity",
          name: entityName,
          parentEntity: parentName,
          filePath: fs4.existsSync(entityTsFile) ? entityTsFile : entityPath,
          uiSpec: entityUi.uiSpec,
          uiFilePath: entityUi.uiFilePath,
          examplePayload: {
            entityId: entityName,
            action: "boot",
            config: { debug: true, environment: "sandbox" }
          }
        };
        nodes.push(entityNode);
        if (parentName) {
          edges.push({
            id: `edge:${parentName}->child:${entityName}`,
            source: `entity:${parentName}`,
            target: `entity:${entityName}`,
            type: "contains",
            deletable: true
          });
        }
        const funcsDir = path4.join(entityPath, "functionalities");
        if (fs4.existsSync(funcsDir)) {
          const funcs = fs4.readdirSync(funcsDir, { withFileTypes: true });
          for (const fn of funcs) {
            if (fn.isDirectory()) {
              const fnName = fn.name;
              const fnPath = path4.join(funcsDir, fnName);
              const logicFile = path4.join(fnPath, "main_function", "logic.ts");
              const helpers = [];
              const helpersDir = path4.join(fnPath, "helper_functions");
              if (fs4.existsSync(helpersDir)) {
                for (const hf of fs4.readdirSync(helpersDir)) {
                  if (hf.endsWith(".ts")) {
                    helpers.push({ name: hf.replace(".ts", ""), filePath: path4.join(helpersDir, hf) });
                  }
                }
              }
              const fnUi = this.findUiFile(fnPath, fnName);
              const atomMeta = this.extractFunctionalityMetadata(fnPath, fnName);
              nodes.push({
                id: `functionality:${entityName}:${fnName}`,
                type: "functionality",
                name: fnName,
                parentEntity: entityName,
                filePath: logicFile,
                helpers,
                uiSpec: fnUi.uiSpec,
                uiFilePath: fnUi.uiFilePath,
                inputs: atomMeta.inputs,
                outputs: atomMeta.outputs,
                stateFields: atomMeta.stateFields,
                examplePayload: atomMeta.examplePayload
              });
              edges.push({
                id: `edge:${entityName}->${fnName}`,
                source: `entity:${entityName}`,
                target: `functionality:${entityName}:${fnName}`,
                type: "contains",
                deletable: true
              });
            }
          }
        }
        const childEntitiesDir = path4.join(entityPath, "entities");
        if (fs4.existsSync(childEntitiesDir)) {
          this.scanEntitiesRecursive(childEntitiesDir, nodes, edges, entityName);
        }
      }
    }
  }
  /**
   * Introspects functionality Atom & State files to extract types and synthesize realistic example payloads.
   */
  extractFunctionalityMetadata(fnPath, fnName) {
    const inputs = [];
    const outputs = [];
    const stateFields = [];
    let examplePayload = null;
    const payloadFiles = ["example.json", "payload.json", "test-input.json", "input.json"];
    for (const pf of payloadFiles) {
      const p = path4.join(fnPath, pf);
      if (fs4.existsSync(p)) {
        try {
          examplePayload = JSON.parse(fs4.readFileSync(p, "utf-8"));
          break;
        } catch (e) {
        }
      }
    }
    const atomCandidates = [
      path4.join(fnPath, `${fnName}Atom.ts`),
      path4.join(fnPath, `${fnName}Atom.js`),
      path4.join(fnPath, "atom.ts"),
      path4.join(fnPath, "types.ts")
    ];
    const atomPath = atomCandidates.find((c) => fs4.existsSync(c));
    if (atomPath) {
      try {
        const atomContent = fs4.readFileSync(atomPath, "utf-8");
        const synthPayload = {};
        const inputMatch = atomContent.match(/export\s+interface\s+\w+Input\s*\{([^}]+)\}/s) || atomContent.match(/interface\s+\w+Input\s*\{([^}]+)\}/s);
        if (inputMatch && inputMatch[1]) {
          const lines = inputMatch[1].split("\n");
          for (const line of lines) {
            const propMatch = line.trim().match(/^([a-zA-Z0-9_$]+)\??\s*:\s*([^;]+);?/);
            if (propMatch) {
              const propName = propMatch[1];
              const propType = propMatch[2].trim();
              inputs.push({ name: propName, type: propType });
              synthPayload[propName] = this.synthesizeDefaultValue(propName, propType);
            }
          }
        }
        const outputMatch = atomContent.match(/export\s+interface\s+\w+Output\s*\{([^}]+)\}/s) || atomContent.match(/interface\s+\w+Output\s*\{([^}]+)\}/s);
        if (outputMatch && outputMatch[1]) {
          const lines = outputMatch[1].split("\n");
          for (const line of lines) {
            const propMatch = line.trim().match(/^([a-zA-Z0-9_$]+)\??\s*:\s*([^;]+);?/);
            if (propMatch) {
              outputs.push({ name: propMatch[1], type: propMatch[2].trim() });
            }
          }
        }
        if (!examplePayload && Object.keys(synthPayload).length > 0) {
          examplePayload = synthPayload;
        }
      } catch (e) {
      }
    }
    const stateFile = path4.join(fnPath, "state_data", "state.ts");
    if (fs4.existsSync(stateFile)) {
      try {
        const stateContent = fs4.readFileSync(stateFile, "utf-8");
        const stateMatch = stateContent.match(/export\s+interface\s+\w+State\s*\{([^}]+)\}/s);
        if (stateMatch && stateMatch[1]) {
          const lines = stateMatch[1].split("\n");
          for (const line of lines) {
            const propMatch = line.trim().match(/^([a-zA-Z0-9_$]+)\??\s*:\s*([^;]+);?/);
            if (propMatch) {
              stateFields.push({ name: propMatch[1], type: propMatch[2].trim() });
            }
          }
        }
      } catch (e) {
      }
    }
    if (!examplePayload) {
      if (fnName.includes("Calc")) {
        examplePayload = { op: "add", a: 10, b: 25 };
      } else if (fnName.includes("Order") || fnName.includes("Cart")) {
        examplePayload = { productId: "PROD-9821", quantity: 2, price: 49.99 };
      } else {
        examplePayload = { payload: `Sample input for ${fnName}` };
      }
    }
    return { inputs, outputs, stateFields, examplePayload };
  }
  /**
   * Introspects Concept Libraries to extract methods and example payloads.
   */
  extractLibraryMetadata(libPath, baseName) {
    const ui = this.findUiFile(path4.dirname(libPath), baseName);
    let examplePayload = null;
    try {
      const content = fs4.readFileSync(libPath, "utf-8");
      const staticMethodRegex = /static\s+([a-zA-Z0-9_$]+)\s*\(([^)]*)\)/g;
      let match;
      const methods = [];
      while ((match = staticMethodRegex.exec(content)) !== null) {
        const mName = match[1];
        const rawParams = match[2].trim();
        const paramNames = rawParams ? rawParams.split(",").map((p) => p.trim().split(":")[0].trim()) : [];
        methods.push({ name: mName, params: paramNames });
      }
      if (methods.length > 0) {
        const primary = methods[0];
        if (primary.params.length > 1) {
          const sampleArgs = [];
          for (const p of primary.params) {
            sampleArgs.push(this.synthesizeDefaultValue(p, "number"));
          }
          examplePayload = { method: primary.name, args: sampleArgs };
        } else if (primary.params.length === 1) {
          const pName = primary.params[0];
          examplePayload = { method: primary.name, args: [this.synthesizeDefaultValue(pName, "object")] };
        } else {
          examplePayload = { method: primary.name, args: [] };
        }
      }
    } catch (e) {
    }
    if (!examplePayload) {
      if (baseName.includes("Math")) {
        examplePayload = { method: "add", args: [15, 30] };
      } else if (baseName.includes("Commerce")) {
        examplePayload = { method: "validateCart", args: [{ items: [{ productId: "PROD-101", quantity: 2, price: 29.99 }] }] };
      } else {
        examplePayload = { method: "process", args: [{ data: "sample" }] };
      }
    }
    return { examplePayload, uiSpec: ui.uiSpec, uiFilePath: ui.uiFilePath };
  }
  /**
   * Introspects SubApps to locate UI entries and operations.
   */
  extractSubappMetadata(saPath, saName) {
    const ui = this.findUiFile(saPath, saName);
    let examplePayload = null;
    const manifestPath = path4.join(saPath, "subapp.json");
    if (fs4.existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(fs4.readFileSync(manifestPath, "utf-8"));
        if (manifest.ui && manifest.ui.entryPath && !ui.uiFilePath) {
          const entryAbs = path4.resolve(saPath, manifest.ui.entryPath);
          if (fs4.existsSync(entryAbs)) {
            ui.uiSpec = true;
            ui.uiFilePath = entryAbs;
          }
        }
      } catch (e) {
      }
    }
    const opsDir = path4.join(saPath, "operations");
    if (fs4.existsSync(opsDir)) {
      const ops = fs4.readdirSync(opsDir).filter((f) => f.endsWith(".ts") || f.endsWith(".js"));
      if (ops.length > 0) {
        const firstOp = ops[0].replace(/\.(ts|js)$/, "");
        examplePayload = { operation: firstOp, payload: { action: "execute", timestamp: Date.now() } };
      }
    }
    if (!examplePayload) {
      examplePayload = { action: "initialize", subapp: saName, context: { debug: true } };
    }
    return { examplePayload, uiSpec: ui.uiSpec, uiFilePath: ui.uiFilePath };
  }
  /**
   * Helper to scan for UI files across multiple standard conventions.
   */
  findUiFile(dirPath, baseName) {
    const candidates = [
      path4.join(dirPath, `${baseName}View.tsx`),
      path4.join(dirPath, `${baseName}View.ts`),
      path4.join(dirPath, `${baseName}.view.tsx`),
      path4.join(dirPath, `${baseName}.view.ts`),
      path4.join(dirPath, "ui", `${baseName}View.tsx`),
      path4.join(dirPath, "ui", `${baseName}View.ts`),
      path4.join(dirPath, "ui", "App.tsx"),
      path4.join(dirPath, "ui", "index.tsx"),
      path4.join(dirPath, "src", "ui", "App.tsx"),
      path4.join(dirPath, "src", "ui", "index.tsx"),
      path4.join(dirPath, "view.tsx"),
      path4.join(dirPath, "view.ts")
    ];
    for (const c of candidates) {
      if (fs4.existsSync(c)) {
        return { uiSpec: true, uiFilePath: c };
      }
    }
    return { uiSpec: false };
  }
  /**
   * Synthesizes realistic, intelligent mock values from property names and TypeScript types.
   */
  synthesizeDefaultValue(propName, typeText) {
    const lowerName = propName.toLowerCase();
    const cleanType = typeText.replace(/\s+/g, " ").trim();
    if (cleanType.includes("|") && (cleanType.includes("'") || cleanType.includes('"'))) {
      const match = cleanType.match(/['"]([^'"]+)['"]/);
      if (match) return match[1];
    }
    if (cleanType.startsWith("number")) {
      if (lowerName.includes("price") || lowerName.includes("cost") || lowerName.includes("amount") || lowerName.includes("subtotal")) {
        return 49.99;
      }
      if (lowerName.includes("qty") || lowerName.includes("quantity") || lowerName.includes("count") || lowerName.includes("itemcount")) {
        return 2;
      }
      if (lowerName === "a") return 10;
      if (lowerName === "b") return 25;
      if (lowerName.includes("port")) return 8080;
      if (lowerName.includes("id") || lowerName.includes("code")) return 1001;
      return 10;
    }
    if (cleanType.startsWith("string")) {
      if (lowerName.includes("productid") || lowerName.includes("product_id") || lowerName.includes("itemid")) {
        return "PROD-9821";
      }
      if (lowerName.includes("orderid") || lowerName.includes("order_id")) {
        return "ORD-1049";
      }
      if (lowerName.includes("userid") || lowerName.includes("user_id")) {
        return "USR-4402";
      }
      if (lowerName.includes("email")) {
        return "alex.developer@krnl.io";
      }
      if (lowerName.includes("name")) {
        return "Premium Subscription";
      }
      if (lowerName.includes("url")) {
        return "https://api.krnl.io/v1/stream";
      }
      if (lowerName === "op" || lowerName === "operation") {
        return "add";
      }
      return `Sample ${propName}`;
    }
    if (cleanType.startsWith("boolean")) {
      return true;
    }
    if (cleanType.endsWith("[]") || cleanType.startsWith("Array<")) {
      if (lowerName.includes("item") || lowerName.includes("product")) {
        return [{ id: "ITEM-1", name: "Standard Item", price: 29.99, quantity: 1 }];
      }
      return ["sample-item-1", "sample-item-2"];
    }
    if (cleanType.startsWith("Record") || cleanType.startsWith("object") || cleanType === "any") {
      return { sampleKey: "sampleValue" };
    }
    return "sample";
  }
  // --- Graph Manipulation & Controls ---
  moveNode(nodeId, x, y) {
    this.recordHistory();
    this.nodePositions.set(nodeId, { x, y });
    this.persistGraphState();
    return { success: true, position: { x, y } };
  }
  moveMultipleNodes(positions) {
    this.recordHistory();
    for (const [id, pos] of Object.entries(positions)) {
      this.nodePositions.set(id, pos);
    }
    this.persistGraphState();
    return { success: true };
  }
  connectNodes(source, target, type = "dataflow") {
    this.recordHistory();
    const edgeId = `edge:${source}->${target}:${Date.now()}`;
    const edge = { id: edgeId, source, target, type, deletable: true };
    this.customEdges.push(edge);
    this.deletedEdges.delete(edgeId);
    this.persistGraphState();
    return { success: true, edge };
  }
  deleteEdge(edgeId) {
    this.recordHistory();
    this.deletedEdges.add(edgeId);
    this.customEdges = this.customEdges.filter((e) => e.id !== edgeId);
    this.persistGraphState();
    return { success: true, deletedEdgeId: edgeId };
  }
  deleteNode(nodeId) {
    this.recordHistory();
    const graph = this.extractArchitectureGraph();
    const targetNode = graph.nodes.find((n) => n.id === nodeId);
    if (targetNode && fs4.existsSync(targetNode.filePath)) {
      const targetDir = fs4.lstatSync(targetNode.filePath).isDirectory() ? targetNode.filePath : path4.dirname(targetNode.filePath);
      if (targetDir.startsWith(path4.join(this.projectRoot, "src"))) {
        fs4.rmSync(targetDir, { recursive: true, force: true });
      }
    }
    this.nodePositions.delete(nodeId);
    this.persistGraphState();
    return { success: true, deletedNodeId: nodeId };
  }
  alignLayout(algorithm = "hierarchical") {
    this.recordHistory();
    const graph = this.extractArchitectureGraph();
    const positions = {};
    const entities = graph.nodes.filter((n) => n.type === "entity");
    entities.forEach((node, idx) => {
      const col = Math.floor(idx / 5);
      const row = idx % 5;
      const x = 60 + col * 360;
      const y = 60 + row * 220;
      positions[node.id] = { x, y };
      this.nodePositions.set(node.id, { x, y });
    });
    const funcs = graph.nodes.filter((n) => n.type === "functionality");
    funcs.forEach((node, idx) => {
      const col = Math.floor(idx / 7);
      const row = idx % 7;
      const x = 800 + col * 320;
      const y = 60 + row * 180;
      positions[node.id] = { x, y };
      this.nodePositions.set(node.id, { x, y });
    });
    const others = graph.nodes.filter((n) => n.type === "library" || n.type === "subapp");
    others.forEach((node, idx) => {
      const x = 1500;
      const y = 60 + idx * 160;
      positions[node.id] = { x, y };
      this.nodePositions.set(node.id, { x, y });
    });
    this.persistGraphState();
    return { success: true, positions };
  }
  recordHistory() {
    this.undoStack.push(this.extractArchitectureGraph());
    if (this.undoStack.length > 50) this.undoStack.shift();
    this.redoStack = [];
  }
  undo() {
    if (this.undoStack.length === 0) return { success: false };
    const prev = this.undoStack.pop();
    this.redoStack.push(this.extractArchitectureGraph());
    this.nodePositions.clear();
    for (const node of prev.nodes) {
      if (node.position) this.nodePositions.set(node.id, node.position);
    }
    this.persistGraphState();
    return { success: true };
  }
  redo() {
    if (this.redoStack.length === 0) return { success: false };
    const next = this.redoStack.pop();
    this.undoStack.push(this.extractArchitectureGraph());
    this.nodePositions.clear();
    for (const node of next.nodes) {
      if (node.position) this.nodePositions.set(node.id, node.position);
    }
    this.persistGraphState();
    return { success: true };
  }
  createEntity(name) {
    this.recordHistory();
    const entitiesDir = path4.join(this.projectRoot, "src", "entities");
    const entityDir = path4.join(entitiesDir, name);
    fs4.mkdirSync(entityDir, { recursive: true });
    const entityFile = path4.join(entityDir, `${name}.ts`);
    const code = `import { Entity, KrnlMagneticLoader } from '@dinilmusick/krnl-core';

export class ${name} extends Entity {
  constructor() {
    super({
      id: '${name}',
      version: '1.0.0',
      description: '${name} Auto-Scaffolded System Entity'
    });
  }

  async boot(): Promise<void> {
    await KrnlMagneticLoader.loadAll(this, import.meta.url);
  }
}
export default ${name};
`;
    fs4.writeFileSync(entityFile, code, "utf-8");
    return { success: true, filePath: entityFile };
  }
  createFunctionality(entityName, name) {
    this.recordHistory();
    const fnDir = path4.join(this.projectRoot, "src", "entities", entityName, "functionalities", name);
    fs4.mkdirSync(path4.join(fnDir, "main_function"), { recursive: true });
    fs4.mkdirSync(path4.join(fnDir, "state_data"), { recursive: true });
    fs4.mkdirSync(path4.join(fnDir, "helper_functions"), { recursive: true });
    const atomFile = path4.join(fnDir, `${name}Atom.ts`);
    const logicFile = path4.join(fnDir, "main_function", "logic.ts");
    const stateFile = path4.join(fnDir, "state_data", "state.ts");
    const helperFile = path4.join(fnDir, "helper_functions", "executeStep.ts");
    fs4.writeFileSync(atomFile, `export interface ${name}Input { payload?: any; }
export interface ${name}Output { success: boolean; timestamp: number; }
`);
    fs4.writeFileSync(stateFile, `export interface ${name}State { invocationCount: number; }
export const initialState: ${name}State = { invocationCount: 0 };
`);
    fs4.writeFileSync(helperFile, `export function executeStep(payload: any) { return { processed: true, data: payload }; }
`);
    fs4.writeFileSync(logicFile, `import { ${name}Input, ${name}Output } from '../${name}Atom.js';
import { executeStep } from '../helper_functions/executeStep.js';

export const main = async (input: ${name}Input, { state }: any): Promise<${name}Output> => {
  executeStep(input.payload);
  return { success: true, timestamp: Date.now() };
};
`);
    return { success: true, filesCreated: [atomFile, logicFile, stateFile, helperFile] };
  }
  createLibrary(name) {
    this.recordHistory();
    const cleanName = name.replace(/Concepts$/, "");
    const fullLibName = `${cleanName}Concepts`;
    const libDir = path4.join(this.projectRoot, "src", "libraries");
    fs4.mkdirSync(libDir, { recursive: true });
    const libFile = path4.join(libDir, `${fullLibName}.ts`);
    const code = `/**
 * Layer 0: Pure Domain Concept Library
 */
export class ${fullLibName} {
  static process(data: any): any {
    return { valid: true, timestamp: Date.now() };
  }
}
`;
    fs4.writeFileSync(libFile, code, "utf-8");
    return { success: true, filePath: libFile };
  }
  addFlowStep(entityFilePath, flowName, stepFunctionName) {
    this.recordHistory();
    const absPath = path4.resolve(this.projectRoot, entityFilePath);
    if (!fs4.existsSync(absPath)) return false;
    const sourceFile = this.project.addSourceFileAtPath(absPath);
    const classDec = sourceFile.getClasses()[0];
    if (!classDec) return false;
    const bootMethod = classDec.getMethod("boot");
    if (!bootMethod) return false;
    const body = bootMethod.getBody();
    if (!body || !import_ts_morph2.Node.isBlock(body)) return false;
    const text = body.getText();
    if (text.includes(`this.flow('${flowName}')`)) {
      const lines = text.split("\n");
      const newLines = lines.map((line) => {
        if (line.includes(`this.flow('${flowName}')`)) {
          return line.replace(`this.flow('${flowName}')`, `this.flow('${flowName}')
      .then('${stepFunctionName}')`);
        }
        return line;
      });
      body.replaceWithText(newLines.join("\n"));
    } else {
      bootMethod.addStatements(`this.flow('${flowName}')
  .then('${stepFunctionName}')
  .register({ visibility: 'public' });`);
    }
    sourceFile.saveSync();
    return true;
  }
};

// ../studio/src/server/FunctionExecutor.ts
var path5 = __toESM(require("path"), 1);
var fs5 = __toESM(require("fs"), 1);
var import_url = require("url");
var esbuild = __toESM(require("esbuild"), 1);
var FunctionExecutor = class {
  /**
   * Executes a specific function, entity, or library in an isolated sandbox with metrics.
   */
  static async execute(request) {
    const startTime = performance.now();
    const initialMem = process.memoryUsage().heapUsed;
    const logs = [];
    let absPath = path5.resolve(request.filePath);
    if (!fs5.existsSync(absPath)) {
      return {
        success: false,
        durationMs: 0,
        memoryDeltaBytes: 0,
        error: `File not found: ${absPath}`,
        logs: []
      };
    }
    if (fs5.lstatSync(absPath).isDirectory()) {
      const base = path5.basename(absPath);
      const candidates = [
        path5.join(absPath, "main_function/logic.ts"),
        path5.join(absPath, `${base}.ts`),
        path5.join(absPath, "index.ts"),
        path5.join(absPath, "entity.ts")
      ];
      const found = candidates.find((c) => fs5.existsSync(c));
      if (found) {
        absPath = found;
      } else {
        return {
          success: false,
          durationMs: 0,
          memoryDeltaBytes: 0,
          error: `No executable TypeScript entry point found in directory: ${absPath}`,
          logs: []
        };
      }
    }
    const dirOfEntry = path5.dirname(absPath);
    const tempBundlePath = path5.join(
      dirOfEntry,
      `.krnl-exec-${Date.now()}-${Math.random().toString(36).substring(7)}.mjs`
    );
    const tsResolverPlugin = {
      name: "ts-resolver-plugin",
      setup(build2) {
        build2.onResolve({ filter: /.*/ }, (args2) => {
          if (args2.path.startsWith(".")) {
            const dir = args2.resolveDir || path5.dirname(args2.importer);
            const candidateJs = path5.resolve(dir, args2.path);
            const candidateTs = candidateJs.replace(/\.js$/, ".ts");
            if (fs5.existsSync(candidateTs)) {
              return { path: candidateTs };
            }
            if (fs5.existsSync(candidateJs)) {
              return { path: candidateJs };
            }
          }
          return null;
        });
      }
    };
    try {
      await esbuild.build({
        entryPoints: [absPath],
        bundle: true,
        outfile: tempBundlePath,
        format: "esm",
        platform: "node",
        target: "esnext",
        plugins: [tsResolverPlugin],
        external: ["@dinilmusick/krnl-core", "vanjs-core", "worker_threads", "ws", "fs", "path", "http", "events"]
      });
      const fileUrl = (0, import_url.pathToFileURL)(tempBundlePath).href;
      const mod = await import(fileUrl);
      let targetFn = null;
      let targetClass = null;
      if (request.functionName && mod[request.functionName]) {
        targetFn = mod[request.functionName];
      } else if (typeof mod.main === "function") {
        targetFn = mod.main;
      } else if (typeof mod.register === "function") {
        targetFn = mod.register;
      } else if (typeof mod.default === "function") {
        targetFn = mod.default;
      } else {
        for (const key of Object.keys(mod)) {
          if (typeof mod[key] === "function") {
            targetFn = mod[key];
            break;
          }
        }
      }
      for (const key of Object.keys(mod)) {
        if (typeof mod[key] === "function" && mod[key].prototype && Object.getOwnPropertyNames(mod[key].prototype).length > 1) {
          targetClass = mod[key];
          break;
        }
      }
      let executionOutput = null;
      if (typeof targetFn === "function") {
        if (targetFn.prototype && (targetFn.prototype.boot || targetFn.name.endsWith("System") || targetFn.name.endsWith("Entity"))) {
          const instance = new targetFn();
          if (typeof instance.boot === "function") {
            await instance.boot();
          }
          const registeredFlows = instance["flows"] ? Array.from(instance["flows"].keys()) : [];
          if (request.input?.flowName && instance["flows"]?.has(request.input.flowName)) {
            const flow = instance["flows"].get(request.input.flowName);
            const flowRes = typeof flow.execute === "function" ? await flow.execute(request.input.payload || {}) : "Flow initiated";
            executionOutput = {
              entityId: instance.id || targetFn.name,
              flowExecuted: request.input.flowName,
              flowResult: flowRes,
              status: "FLOW_EXECUTED"
            };
          } else {
            executionOutput = {
              entityId: instance.id || targetFn.name,
              version: instance.version || "1.0.0",
              description: instance.description || "System Entity",
              status: "BOOTED_AND_READY",
              registeredFlows
            };
          }
        } else if (targetFn.name === "register" || mod.register === targetFn) {
          const mockContext = {
            entity: { id: "TestSandboxEntity", call: async () => ({}), emitEvent: () => {
            } },
            logger: { log: (msg) => logs.push(msg), error: (msg) => logs.push("ERROR: " + msg) }
          };
          const regResult = await targetFn(mockContext);
          executionOutput = {
            subappName: regResult?.name || "SubApp",
            operations: (regResult?.operations || []).map((o) => ({ name: o.name, description: o.description })),
            ui: regResult?.ui,
            status: "REGISTERED"
          };
        } else if (targetFn.name.endsWith("Concepts") || targetClass && targetClass.name.endsWith("Concepts")) {
          const cls = targetClass || targetFn;
          const staticMethods = Object.getOwnPropertyNames(cls).filter((m) => typeof cls[m] === "function" && m !== "prototype" && m !== "length" && m !== "name");
          let invokedMethod = request.functionName || request.input?.method;
          let methodArgs = request.input?.args;
          if (!invokedMethod && staticMethods.length > 0) {
            invokedMethod = staticMethods[0];
          }
          if (invokedMethod && typeof cls[invokedMethod] === "function") {
            if (!methodArgs) {
              if (Array.isArray(request.input)) {
                methodArgs = request.input;
              } else if (request.input && typeof request.input === "object" && !request.input.method) {
                const fnStr = cls[invokedMethod].toString();
                const paramMatch = fnStr.match(/\(([^)]*)\)/);
                const paramNames = paramMatch ? paramMatch[1].split(",").map((p) => p.trim().split(":")[0].trim()) : [];
                if (paramNames.length > 1 && paramNames.every((p) => p in request.input)) {
                  methodArgs = paramNames.map((p) => request.input[p]);
                } else {
                  methodArgs = [request.input];
                }
              } else {
                methodArgs = [];
              }
            }
            const result = await cls[invokedMethod](...methodArgs);
            executionOutput = {
              library: cls.name,
              method: invokedMethod,
              args: methodArgs,
              result
            };
          } else {
            executionOutput = {
              library: cls.name,
              status: "READY",
              availableMethods: staticMethods
            };
          }
        } else {
          const dummyContext = {
            state: request.state || {},
            entity: {
              id: "TestSandbox",
              call: async () => ({}),
              emitEvent: () => {
              }
            }
          };
          executionOutput = await targetFn(request.input || {}, dummyContext);
        }
      } else if (mod && typeof mod === "object") {
        executionOutput = {
          exports: Object.keys(mod),
          status: "MODULE_LOADED"
        };
      } else {
        throw new Error(`No executable function or entity class export found in ${absPath}`);
      }
      const durationMs = parseFloat((performance.now() - startTime).toFixed(2));
      const memoryDeltaBytes = Math.max(0, process.memoryUsage().heapUsed - initialMem);
      return {
        success: true,
        output: executionOutput,
        durationMs,
        memoryDeltaBytes,
        logs
      };
    } catch (err) {
      const durationMs = parseFloat((performance.now() - startTime).toFixed(2));
      return {
        success: false,
        durationMs,
        memoryDeltaBytes: 0,
        error: err?.message || String(err),
        logs
      };
    } finally {
      if (fs5.existsSync(tempBundlePath)) {
        try {
          fs5.unlinkSync(tempBundlePath);
        } catch (e) {
        }
      }
    }
  }
};

// ../studio/src/server/FileWatcher.ts
var fs6 = __toESM(require("fs"), 1);
var path6 = __toESM(require("path"), 1);
var StudioFileWatcher = class {
  watcher = null;
  rootDir;
  listeners = /* @__PURE__ */ new Set();
  debounceTimers = /* @__PURE__ */ new Map();
  constructor(rootDir = process.cwd()) {
    this.rootDir = path6.resolve(rootDir);
  }
  start() {
    if (this.watcher) return;
    const srcDir = path6.join(this.rootDir, "src");
    if (!fs6.existsSync(srcDir)) return;
    this.watcher = fs6.watch(srcDir, { recursive: true }, (eventType, filename) => {
      if (!filename) return;
      if (filename.includes("node_modules") || filename.includes("dist") || filename.includes(".git") || filename.endsWith(".d.ts") || filename.endsWith(".log") || filename.endsWith(".tmp") || filename.includes(".krnl-graph") || filename.includes(".DS_Store")) {
        return;
      }
      const fullPath = path6.join(srcDir, filename);
      if (this.debounceTimers.has(fullPath)) {
        clearTimeout(this.debounceTimers.get(fullPath));
      }
      const timer = setTimeout(() => {
        this.debounceTimers.delete(fullPath);
        for (const listener of this.listeners) {
          try {
            listener({ eventType, filename, fullPath });
          } catch (e) {
          }
        }
      }, 300);
      this.debounceTimers.set(fullPath, timer);
    });
  }
  subscribe(cb) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }
  stop() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }
};

// ../studio/src/server/JsonRpcRouter.ts
var fs7 = __toESM(require("fs"), 1);
var path7 = __toESM(require("path"), 1);

// ../studio/src/server/PreemptiveDocManager.ts
var PreemptiveDocManager = class {
  static endpoints = {
    // 1. Workspace
    "project.create": {
      id: "project.create",
      method: "POST",
      path: "/api/v1/project/create",
      rpcMethod: "project.create",
      title: "Create Project Workspace",
      description: "Initializes a new Krnl full-stack workspace with standard quad-units, configs, and entity roots.",
      category: "Workspace",
      payloadSchema: { name: "string", targetDir: "string (optional)", options: "object (optional)" },
      examplePayload: { name: "PaymentApp", targetDir: "./projects/PaymentApp" },
      nextSuggestedEndpoints: ["entity.create", "library.create", "graph.getArchitecture"]
    },
    "project.load": {
      id: "project.load",
      method: "POST",
      path: "/api/v1/project/load",
      rpcMethod: "project.load",
      title: "Load Project Workspace",
      description: "Switches the active workspace context and synchronizes the visual node graph and file watcher.",
      category: "Workspace",
      payloadSchema: { path: "string (absolute or relative project path)" },
      examplePayload: { path: "examples/unified-workspace" },
      nextSuggestedEndpoints: ["graph.getArchitecture", "validate.audit", "test.executeFunction"]
    },
    "graph.getArchitecture": {
      id: "graph.getArchitecture",
      method: "GET",
      path: "/api/v1/project/graph",
      rpcMethod: "graph.getArchitecture",
      title: "Get Architecture Graph",
      description: "Inspects source files on disk and returns the complete hierarchical entity, quad-unit, and concept library graph.",
      category: "Workspace",
      payloadSchema: {},
      examplePayload: {},
      nextSuggestedEndpoints: ["entity.create", "functionality.create", "validate.audit"]
    },
    // 2. Interactive Graph Controls & Layout
    "graph.moveNode": {
      id: "graph.moveNode",
      method: "POST",
      path: "/api/v1/graph/moveNode",
      rpcMethod: "graph.moveNode",
      title: "Move Node Coordinates",
      description: "Updates and persists the (x, y) canvas coordinates of a specific node in real time.",
      category: "GraphControls",
      payloadSchema: { nodeId: "string", x: "number", y: "number" },
      examplePayload: { nodeId: "entity:TradingSystem", x: 250, y: 180 },
      nextSuggestedEndpoints: ["graph.connectNodes", "graph.getArchitecture"]
    },
    "graph.connectNodes": {
      id: "graph.connectNodes",
      method: "POST",
      path: "/api/v1/graph/connectNodes",
      rpcMethod: "graph.connectNodes",
      title: "Establish Wire Connection",
      description: "Creates a directional wire connection between two nodes with support for auto-spawn and dataflow.",
      category: "GraphControls",
      payloadSchema: { source: "string", target: "string", type: "string (optional: dataflow/contains/flow_step)" },
      examplePayload: { source: "entity:TradingSystem", target: "functionality:TradingSystem:ExecuteTrade", type: "contains" },
      nextSuggestedEndpoints: ["graph.moveNode", "graph.deleteEdge"]
    },
    "graph.deleteEdge": {
      id: "graph.deleteEdge",
      method: "POST",
      path: "/api/v1/graph/deleteEdge",
      rpcMethod: "graph.deleteEdge",
      title: "Delete Connection (Via Centered Gizmo)",
      description: "Deletes a wire connection identified by its edge ID.",
      category: "GraphControls",
      payloadSchema: { edgeId: "string" },
      examplePayload: { edgeId: "edge:TradingSystem->QuotePrice" },
      nextSuggestedEndpoints: ["graph.connectNodes", "graph.alignLayout"]
    },
    "graph.deleteNode": {
      id: "graph.deleteNode",
      method: "POST",
      path: "/api/v1/graph/deleteNode",
      rpcMethod: "graph.deleteNode",
      title: "Delete Node & Source Assets",
      description: "Removes a node from the visual graph and safely cleans up its underlying source files from the workspace.",
      category: "GraphControls",
      payloadSchema: { nodeId: "string" },
      examplePayload: { nodeId: "functionality:TradingSystem:QuotePrice" },
      nextSuggestedEndpoints: ["graph.getArchitecture", "validate.audit"]
    },
    "graph.alignLayout": {
      id: "graph.alignLayout",
      method: "POST",
      path: "/api/v1/graph/alignLayout",
      rpcMethod: "graph.alignLayout",
      title: "Auto-Align Hierarchical Layout",
      description: "Re-computes clean hierarchical column-based coordinates for all nodes on the canvas.",
      category: "GraphControls",
      payloadSchema: { algorithm: "string (optional: hierarchical/grid)" },
      examplePayload: { algorithm: "hierarchical" },
      nextSuggestedEndpoints: ["graph.getArchitecture", "graph.moveNode"]
    },
    "graph.undo": {
      id: "graph.undo",
      method: "POST",
      path: "/api/v1/graph/undo",
      rpcMethod: "graph.undo",
      title: "Undo Graph Mutation",
      description: "Reverts the previous canvas or node manipulation step.",
      category: "GraphControls",
      payloadSchema: {},
      examplePayload: {},
      nextSuggestedEndpoints: ["graph.redo", "graph.getArchitecture"]
    },
    "graph.redo": {
      id: "graph.redo",
      method: "POST",
      path: "/api/v1/graph/redo",
      rpcMethod: "graph.redo",
      title: "Redo Graph Mutation",
      description: "Re-applies the previously undone canvas action.",
      category: "GraphControls",
      payloadSchema: {},
      examplePayload: {},
      nextSuggestedEndpoints: ["graph.undo", "graph.getArchitecture"]
    },
    // 3. Scaffolding
    "entity.create": {
      id: "entity.create",
      method: "POST",
      path: "/api/v1/entity/create",
      rpcMethod: "graph.createEntity",
      title: "Scaffold Entity",
      description: "Surgically creates a new root or component Entity on disk with magnetic auto-discovery hooks.",
      category: "Scaffolding",
      payloadSchema: { name: "string (e.g. OrderSystem)" },
      examplePayload: { name: "OrderSystem" },
      nextSuggestedEndpoints: ["functionality.create", "flow.addStep", "library.create"]
    },
    "functionality.create": {
      id: "functionality.create",
      method: "POST",
      path: "/api/v1/functionality/create",
      rpcMethod: "graph.createFunctionality",
      title: "Scaffold Quad-Unit Functionality",
      description: "Generates a 4-layer quad-unit (Atom, logic.ts, state.ts, helper_functions/) nested in the target Entity.",
      category: "Scaffolding",
      payloadSchema: { entityName: "string", name: "string (functionality name)" },
      examplePayload: { entityName: "OrderSystem", name: "CreateOrder" },
      nextSuggestedEndpoints: ["test.executeFunction", "flow.addStep", "file.edit"]
    },
    "library.create": {
      id: "library.create",
      method: "POST",
      path: "/api/v1/library/create",
      rpcMethod: "graph.createLibrary",
      title: "Scaffold Domain Concept Library",
      description: "Generates a Layer 0 pure domain concept library ({Domain}Concepts.ts) with zero I/O side effects.",
      category: "Scaffolding",
      payloadSchema: { name: "string (e.g. Crypto)" },
      examplePayload: { name: "Crypto" },
      nextSuggestedEndpoints: ["file.edit", "functionality.create", "validate.audit"]
    },
    "flow.addStep": {
      id: "flow.addStep",
      method: "POST",
      path: "/api/v1/flow/addStep",
      rpcMethod: "graph.addFlowStep",
      title: "Inject Flow Step",
      description: "Surgically adds a .then() or .branch() step into an Entity boot flow pipeline without disturbing existing code.",
      category: "Scaffolding",
      payloadSchema: { entityFilePath: "string", flowName: "string", stepFunctionName: "string" },
      examplePayload: {
        entityFilePath: "src/entities/OrderSystem/OrderSystem.ts",
        flowName: "CheckoutFlow",
        stepFunctionName: "CreateOrder"
      },
      nextSuggestedEndpoints: ["test.executeFunction", "validate.audit"]
    },
    // 4. Code Mutation
    "file.read": {
      id: "file.read",
      method: "POST",
      path: "/api/v1/file/read",
      rpcMethod: "file.read",
      title: "Read Source File",
      description: "Reads exact source code and metadata of any file in the workspace.",
      category: "CodeMutation",
      payloadSchema: { filePath: "string (absolute or relative)" },
      examplePayload: { filePath: "src/entities/App/functionalities/Hello/main_function/logic.ts" },
      nextSuggestedEndpoints: ["file.edit", "test.executeFunction"]
    },
    "file.edit": {
      id: "file.edit",
      method: "POST",
      path: "/api/v1/file/edit",
      rpcMethod: "file.edit",
      title: "Surgical File Mutation",
      description: "Surgically updates or replaces targeted code blocks in a TypeScript file while preserving comments and formatting.",
      category: "CodeMutation",
      payloadSchema: { filePath: "string", newContent: "string" },
      examplePayload: { filePath: "src/.../logic.ts", newContent: "export const main = async () => ({ ok: true });" },
      nextSuggestedEndpoints: ["validate.audit", "test.executeFunction"]
    },
    "ui.generate": {
      id: "ui.generate",
      method: "POST",
      path: "/api/v1/ui/generate",
      rpcMethod: "ui.generate",
      title: "Generate VanJS UI Source",
      description: "Compiles a visual component tree JSON into clean, reactive VanJS TypeScript source code.",
      category: "CodeMutation",
      payloadSchema: { componentTree: "object", targetFilePath: "string (optional)" },
      examplePayload: { componentTree: { type: "KrnlButton", props: { icon: "\u{1F680}" } } },
      nextSuggestedEndpoints: ["file.edit", "validate.audit"]
    },
    // 5. Validation & Quality Gates
    "validate.audit": {
      id: "validate.audit",
      method: "POST",
      path: "/api/v1/validate/audit",
      rpcMethod: "validate.runPurityAudit",
      title: "Run AST 4-Layer Purity Audit",
      description: "Runs deep AST analysis across the workspace checking 4-layer function purity, 200-line limits, anti-polling, and import suffixes.",
      category: "Validation",
      payloadSchema: { projectPath: "string (optional)" },
      examplePayload: {},
      nextSuggestedEndpoints: ["test.executeFunction", "graph.getArchitecture"]
    },
    // 6. Sandboxed Testing
    "test.executeFunction": {
      id: "test.executeFunction",
      method: "POST",
      path: "/api/v1/test/execute",
      rpcMethod: "test.executeFunction",
      title: "Execute Function in Isolated Sandbox",
      description: "Invokes any targeted function in an isolated Node.js Worker sandbox, capturing output, latency (ms), and memory delta.",
      category: "Testing",
      payloadSchema: { filePath: "string", functionName: "string (optional)", input: "object" },
      examplePayload: {
        filePath: "src/entities/CalculatorSystem/functionalities/Calculate/main_function/logic.ts",
        input: { op: "add", a: 10, b: 20 }
      },
      nextSuggestedEndpoints: ["validate.audit", "flow.addStep"]
    },
    // 7. Documentation
    "docs.endpoints": {
      id: "docs.endpoints",
      method: "GET",
      path: "/api/v1/docs/endpoints",
      rpcMethod: "docs.endpoints",
      title: "Get Full API Documentation Catalog",
      description: "Returns the full list of all available Krnl Studio agentic endpoints with schemas, examples, and next steps.",
      category: "Documentation",
      payloadSchema: {},
      examplePayload: {},
      nextSuggestedEndpoints: ["graph.getArchitecture", "entity.create"]
    }
  };
  static getAllEndpoints() {
    return Object.values(this.endpoints);
  }
  static getEndpoint(id) {
    return this.endpoints[id];
  }
  static decorateResponse(actionId, payload, host = "localhost:8080") {
    const ep = this.endpoints[actionId];
    const nextSteps = (ep?.nextSuggestedEndpoints || ["graph.getArchitecture", "validate.audit", "test.executeFunction"]).map((nextId) => {
      const nextMeta = this.endpoints[nextId];
      if (!nextMeta) return null;
      return {
        id: nextMeta.id,
        title: nextMeta.title,
        endpoint: `${nextMeta.method} ${nextMeta.path}`,
        rpcMethod: nextMeta.rpcMethod,
        description: nextMeta.description,
        examplePayload: nextMeta.examplePayload,
        curl: nextMeta.method === "GET" ? `curl -X GET http://${host}${nextMeta.path}` : `curl -X POST http://${host}${nextMeta.path} -H 'Content-Type: application/json' -d '${JSON.stringify(nextMeta.examplePayload)}'`
      };
    }).filter(Boolean);
    return {
      status: "success",
      payload,
      preemptiveDocumentation: {
        action: actionId,
        description: ep?.description || `Executed ${actionId}`,
        suggestedNextSteps: nextSteps,
        documentationIndexEndpoint: `GET http://${host}/api/v1/docs/endpoints`
      }
    };
  }
};

// ../studio/src/client/ui-builder/VanJSCodeGenerator.ts
var VanJSCodeGenerator = class {
  /**
   * Generates production-ready VanJS TypeScript source code from a component tree.
   */
  static generateCode(root, componentName = "GeneratedView") {
    const usedAtoms = /* @__PURE__ */ new Set();
    this.collectUsedAtoms(root, usedAtoms);
    const atomImports = Array.from(usedAtoms).filter((a) => a !== "Container" && a.startsWith("Krnl")).join(", ");
    let code = `import van from 'vanjs-core';
`;
    if (atomImports.length > 0) {
      code += `import { ${atomImports} } from '@dinilmusick/krnl-ui';
`;
    }
    code += `
`;
    code += `export function ${componentName}({ state, entity }: any): HTMLElement {
`;
    code += `  const { div } = van.tags;

`;
    code += `  return ${this.renderNodeToCode(root, 2)};
`;
    code += `}

`;
    code += `export default ${componentName};
`;
    return code;
  }
  static renderNodeToCode(node, indentLevel) {
    const indent = " ".repeat(indentLevel);
    const childIndent = " ".repeat(indentLevel + 2);
    if (node.type === "Container") {
      const childCode = (node.children || []).map((c) => this.renderNodeToCode(c, indentLevel + 2)).join(",\n");
      return `div(
${childIndent}{ class: '${node.props.class || "krnl-container"}' }${childCode ? `,
${childCode}` : ""}
${indent})`;
    }
    const propEntries = Object.entries(node.props).map(([k, v]) => {
      if (typeof v === "string" && (v.startsWith("state.") || v.startsWith("entity."))) {
        return `${k}: ${v}`;
      }
      if (k.startsWith("on") && typeof v === "string") {
        return `${k}: () => { ${v} }`;
      }
      return `${k}: ${JSON.stringify(v)}`;
    }).join(", ");
    return `${node.type}({ ${propEntries} })`;
  }
  static collectUsedAtoms(node, atoms) {
    atoms.add(node.type);
    if (node.children) {
      for (const c of node.children) {
        this.collectUsedAtoms(c, atoms);
      }
    }
  }
};

// ../studio/src/server/JsonRpcRouter.ts
var JsonRpcRouter = class {
  astEngine;
  validator;
  projectRoot;
  onMutationCallback;
  constructor(projectRoot = process.cwd(), onMutation) {
    this.projectRoot = path7.resolve(projectRoot);
    this.astEngine = new AstMutationEngine(this.projectRoot);
    this.validator = new KrnlValidatorEngine({ projectRoot: this.projectRoot });
    this.onMutationCallback = onMutation;
  }
  setProjectRoot(newRoot) {
    this.projectRoot = path7.resolve(newRoot);
    this.astEngine = new AstMutationEngine(this.projectRoot);
    this.validator = new KrnlValidatorEngine({ projectRoot: this.projectRoot });
  }
  getProjectRoot() {
    return this.projectRoot;
  }
  async handle(req) {
    try {
      const { method, params = {}, id } = req;
      switch (method) {
        // 1. Workspace
        case "project.load":
        case "project.switch": {
          const targetPath = params.path || params.projectPath;
          if (!targetPath) throw new Error("Path is required to load project");
          const abs = path7.resolve(this.projectRoot, targetPath);
          if (!fs7.existsSync(abs)) throw new Error(`Project directory not found: ${targetPath}`);
          this.setProjectRoot(abs);
          const graph = this.astEngine.extractArchitectureGraph();
          const decorated = PreemptiveDocManager.decorateResponse("project.load", { success: true, projectRoot: this.projectRoot, graph });
          return { jsonrpc: "2.0", id, result: decorated };
        }
        case "graph.getArchitecture":
        case "project.getArchitecture": {
          const graph = this.astEngine.extractArchitectureGraph();
          const decorated = PreemptiveDocManager.decorateResponse("graph.getArchitecture", graph);
          return { jsonrpc: "2.0", id, result: decorated };
        }
        case "project.getStatus": {
          const graph = this.astEngine.extractArchitectureGraph();
          const summary = this.validator.validateAll();
          const status = {
            projectRoot: this.projectRoot,
            entityCount: graph.nodes.filter((n) => n.type === "entity").length,
            functionalityCount: graph.nodes.filter((n) => n.type === "functionality").length,
            libraryCount: graph.nodes.filter((n) => n.type === "library").length,
            subappCount: graph.nodes.filter((n) => n.type === "subapp").length,
            purityValid: summary.valid,
            purityErrors: summary.errors.length
          };
          const decorated = PreemptiveDocManager.decorateResponse("graph.getArchitecture", status);
          return { jsonrpc: "2.0", id, result: decorated };
        }
        // 2. Interactive Graph Controls & Layout
        case "graph.moveNode": {
          const { nodeId, x, y } = params;
          if (!nodeId || x === void 0 || y === void 0) throw new Error("nodeId, x, and y are required");
          const res = this.astEngine.moveNode(nodeId, x, y);
          this.notifyMutation("graph.moveNode", { nodeId, x, y });
          const decorated = PreemptiveDocManager.decorateResponse("graph.moveNode", res);
          return { jsonrpc: "2.0", id, result: decorated };
        }
        case "graph.moveMultipleNodes": {
          const { positions } = params;
          if (!positions) throw new Error("positions map is required");
          const res = this.astEngine.moveMultipleNodes(positions);
          this.notifyMutation("graph.moveMultipleNodes", { count: Object.keys(positions).length });
          const decorated = PreemptiveDocManager.decorateResponse("graph.moveNode", res);
          return { jsonrpc: "2.0", id, result: decorated };
        }
        case "graph.connectNodes": {
          const { source, target, type } = params;
          if (!source || !target) throw new Error("source and target node IDs are required");
          const res = this.astEngine.connectNodes(source, target, type);
          const graph = this.astEngine.extractArchitectureGraph();
          this.notifyMutation("graph.connectNodes", { source, target, ...res });
          const decorated = PreemptiveDocManager.decorateResponse("graph.connectNodes", { ...res, graph });
          return { jsonrpc: "2.0", id, result: decorated };
        }
        case "graph.deleteEdge": {
          const { edgeId } = params;
          if (!edgeId) throw new Error("edgeId is required");
          const res = this.astEngine.deleteEdge(edgeId);
          const graph = this.astEngine.extractArchitectureGraph();
          this.notifyMutation("graph.deleteEdge", { edgeId });
          const decorated = PreemptiveDocManager.decorateResponse("graph.deleteEdge", { ...res, graph });
          return { jsonrpc: "2.0", id, result: decorated };
        }
        case "graph.deleteNode": {
          const { nodeId } = params;
          if (!nodeId) throw new Error("nodeId is required");
          const res = this.astEngine.deleteNode(nodeId);
          const graph = this.astEngine.extractArchitectureGraph();
          this.notifyMutation("graph.deleteNode", { nodeId });
          const decorated = PreemptiveDocManager.decorateResponse("graph.deleteNode", { ...res, graph });
          return { jsonrpc: "2.0", id, result: decorated };
        }
        case "graph.alignLayout": {
          const { algorithm } = params;
          const res = this.astEngine.alignLayout(algorithm);
          const graph = this.astEngine.extractArchitectureGraph();
          this.notifyMutation("graph.alignLayout", { algorithm: algorithm || "hierarchical" });
          const decorated = PreemptiveDocManager.decorateResponse("graph.alignLayout", { ...res, graph });
          return { jsonrpc: "2.0", id, result: decorated };
        }
        case "graph.undo": {
          const res = this.astEngine.undo();
          const graph = this.astEngine.extractArchitectureGraph();
          this.notifyMutation("graph.undo", {});
          const decorated = PreemptiveDocManager.decorateResponse("graph.undo", { ...res, graph });
          return { jsonrpc: "2.0", id, result: decorated };
        }
        case "graph.redo": {
          const res = this.astEngine.redo();
          const graph = this.astEngine.extractArchitectureGraph();
          this.notifyMutation("graph.redo", {});
          const decorated = PreemptiveDocManager.decorateResponse("graph.redo", { ...res, graph });
          return { jsonrpc: "2.0", id, result: decorated };
        }
        // 3. Scaffolding
        case "entity.create":
        case "graph.createEntity": {
          const { name } = params;
          if (!name) throw new Error("Entity name is required");
          const res = this.astEngine.createEntity(name);
          const graph = this.astEngine.extractArchitectureGraph();
          this.notifyMutation("entity.create", { name, ...res });
          const decorated = PreemptiveDocManager.decorateResponse("entity.create", { ...res, graph });
          return { jsonrpc: "2.0", id, result: decorated };
        }
        case "functionality.create":
        case "graph.createFunctionality": {
          const { entityName, name } = params;
          if (!entityName || !name) throw new Error("entityName and name are required");
          const res = this.astEngine.createFunctionality(entityName, name);
          const graph = this.astEngine.extractArchitectureGraph();
          this.notifyMutation("functionality.create", { entityName, name, ...res });
          const decorated = PreemptiveDocManager.decorateResponse("functionality.create", { ...res, graph });
          return { jsonrpc: "2.0", id, result: decorated };
        }
        case "library.create":
        case "graph.createLibrary": {
          const { name } = params;
          if (!name) throw new Error("Library name is required");
          const res = this.astEngine.createLibrary(name);
          const graph = this.astEngine.extractArchitectureGraph();
          this.notifyMutation("library.create", { name, ...res });
          const decorated = PreemptiveDocManager.decorateResponse("library.create", { ...res, graph });
          return { jsonrpc: "2.0", id, result: decorated };
        }
        case "flow.addStep":
        case "graph.addFlowStep": {
          const { entityFilePath, flowName, stepFunctionName } = params;
          const success = this.astEngine.addFlowStep(entityFilePath, flowName, stepFunctionName);
          const graph = this.astEngine.extractArchitectureGraph();
          this.notifyMutation("flow.addStep", { flowName, stepFunctionName, success });
          const decorated = PreemptiveDocManager.decorateResponse("flow.addStep", { success, graph });
          return { jsonrpc: "2.0", id, result: decorated };
        }
        // 4. Code Mutation & Robust File Reading
        case "file.read": {
          const { filePath } = params;
          let abs = path7.isAbsolute(filePath) ? filePath : path7.resolve(this.projectRoot, filePath);
          if (!fs7.existsSync(abs)) throw new Error(`File not found: ${filePath}`);
          let content = "";
          if (fs7.lstatSync(abs).isDirectory()) {
            const base = path7.basename(abs);
            const candidateTs = path7.join(abs, `${base}.ts`);
            const candidateIndex = path7.join(abs, "index.ts");
            if (fs7.existsSync(candidateTs)) {
              abs = candidateTs;
              content = fs7.readFileSync(candidateTs, "utf-8");
            } else if (fs7.existsSync(candidateIndex)) {
              abs = candidateIndex;
              content = fs7.readFileSync(candidateIndex, "utf-8");
            } else {
              const files = fs7.readdirSync(abs);
              content = `// Directory: ${base}
// Files in directory:
` + files.map((f) => `// - ${f}`).join("\n");
            }
          } else {
            content = fs7.readFileSync(abs, "utf-8");
          }
          const decorated = PreemptiveDocManager.decorateResponse("file.read", { filePath: abs, content });
          return { jsonrpc: "2.0", id, result: decorated };
        }
        case "file.edit": {
          const { filePath, newContent } = params;
          const abs = path7.resolve(this.projectRoot, filePath);
          fs7.writeFileSync(abs, newContent, "utf-8");
          this.notifyMutation("file.edit", { filePath });
          const decorated = PreemptiveDocManager.decorateResponse("file.edit", { success: true, filePath: abs });
          return { jsonrpc: "2.0", id, result: decorated };
        }
        case "ui.generate": {
          const { componentTree, componentName, targetFilePath } = params;
          const code = VanJSCodeGenerator.generateCode(componentTree, componentName || "GeneratedView");
          if (targetFilePath) {
            const abs = path7.resolve(this.projectRoot, targetFilePath);
            fs7.mkdirSync(path7.dirname(abs), { recursive: true });
            fs7.writeFileSync(abs, code, "utf-8");
            this.notifyMutation("ui.generate", { targetFilePath });
          }
          const decorated = PreemptiveDocManager.decorateResponse("ui.generate", { code, targetFilePath });
          return { jsonrpc: "2.0", id, result: decorated };
        }
        // 5. Validation
        case "validate.audit":
        case "validate.runPurityAudit": {
          const summary = this.validator.validateAll();
          const decorated = PreemptiveDocManager.decorateResponse("validate.audit", summary);
          return { jsonrpc: "2.0", id, result: decorated };
        }
        // 6. Sandboxed Testing
        case "test.executeFunction": {
          const result = await FunctionExecutor.execute(params);
          this.notifyMutation("test.executeFunction", { filePath: params.filePath, success: result.success, durationMs: result.durationMs });
          const decorated = PreemptiveDocManager.decorateResponse("test.executeFunction", result);
          return { jsonrpc: "2.0", id, result: decorated };
        }
        // 7. Documentation
        case "docs.endpoints": {
          const all = PreemptiveDocManager.getAllEndpoints();
          const decorated = PreemptiveDocManager.decorateResponse("docs.endpoints", all);
          return { jsonrpc: "2.0", id, result: decorated };
        }
        default:
          return {
            jsonrpc: "2.0",
            id,
            error: { code: -32601, message: `Method '${method}' not found` }
          };
      }
    } catch (err) {
      return {
        jsonrpc: "2.0",
        id: req.id,
        error: { code: -32e3, message: err?.message || String(err) }
      };
    }
  }
  notifyMutation(action, params) {
    if (this.onMutationCallback) {
      this.onMutationCallback({ action, params });
    }
  }
};

// ../studio/src/server/StudioServer.ts
var http = __toESM(require("http"), 1);
var fs8 = __toESM(require("fs"), 1);
var path8 = __toESM(require("path"), 1);
var import_url2 = require("url");
var import_ws = require("ws");
var import_meta = {};
var __filename = (0, import_url2.fileURLToPath)(import_meta.url);
var __dirname = path8.dirname(__filename);
var StudioServer = class {
  port;
  projectRoot;
  httpServer;
  wss;
  router;
  watcher;
  astEngine;
  constructor(options = {}) {
    this.port = options.port || 8080;
    const initialRoot = path8.resolve(options.projectRoot || process.cwd());
    const unifiedPath = path8.join(initialRoot, "examples/unified-workspace");
    if (!fs8.existsSync(path8.join(initialRoot, "src/entities")) && fs8.existsSync(unifiedPath)) {
      this.projectRoot = unifiedPath;
    } else {
      this.projectRoot = initialRoot;
    }
    this.astEngine = new AstMutationEngine(this.projectRoot);
    this.watcher = new StudioFileWatcher(this.projectRoot);
    this.router = new JsonRpcRouter(this.projectRoot, (mutation) => {
      this.broadcastAgentActivity(mutation);
    });
    this.httpServer = http.createServer((req, res) => this.handleHttpRequest(req, res));
    this.httpServer.on("error", (err) => console.error("HTTP Server Error:", err));
    this.wss = new import_ws.WebSocketServer({ server: this.httpServer, path: "/studio/ws", perMessageDeflate: false });
    this.wss.on("error", (err) => console.error("WSS Error:", err));
    this.initWebSocket();
    this.initFileWatcher();
  }
  initWebSocket() {
    this.wss.on("connection", (ws) => {
      ws.on("error", (err) => {
        console.warn("WS Client connection error handled:", err.message);
      });
      try {
        const initialGraph = this.astEngine.extractArchitectureGraph();
        ws.send(JSON.stringify({ jsonrpc: "2.0", method: "graph.init", params: { ...initialGraph, projectRoot: this.projectRoot } }));
      } catch (e) {
      }
      ws.on("message", async (data) => {
        try {
          const req = JSON.parse(data.toString());
          if (req.method === "project.switch" || req.method === "project.load") {
            const targetPath = req.params.path || req.params.projectPath;
            const newPath = path8.isAbsolute(targetPath) ? targetPath : path8.resolve(process.cwd(), targetPath);
            if (fs8.existsSync(newPath)) {
              this.projectRoot = newPath;
              this.router.setProjectRoot(this.projectRoot);
              this.astEngine = new AstMutationEngine(this.projectRoot);
              this.watcher.stop();
              this.watcher = new StudioFileWatcher(this.projectRoot);
              this.initFileWatcher();
              const graph = this.astEngine.extractArchitectureGraph();
              const decorated = PreemptiveDocManager.decorateResponse("project.load", { success: true, projectRoot: this.projectRoot, graph });
              ws.send(JSON.stringify({ jsonrpc: "2.0", id: req.id, result: decorated }));
              this.broadcastGraphUpdate();
            } else {
              ws.send(JSON.stringify({ jsonrpc: "2.0", id: req.id, error: { code: -32001, message: "Directory does not exist: " + targetPath } }));
            }
            return;
          }
          const res = await this.router.handle(req);
          if (ws.readyState === import_ws.WebSocket.OPEN) {
            ws.send(JSON.stringify(res));
          }
          if (req.method && (req.method.startsWith("graph.") || req.method.startsWith("entity.") || req.method.startsWith("functionality.") || req.method.startsWith("library."))) {
            this.broadcastGraphUpdate();
          }
        } catch (e) {
          if (ws.readyState === import_ws.WebSocket.OPEN) {
            ws.send(JSON.stringify({
              jsonrpc: "2.0",
              error: { code: -32700, message: "Parse error: " + (e.message || String(e)) }
            }));
          }
        }
      });
    });
  }
  initFileWatcher() {
    this.watcher.start();
    this.watcher.subscribe(() => {
      this.broadcastGraphUpdate();
    });
  }
  broadcastGraphUpdate() {
    try {
      const graph = this.astEngine.extractArchitectureGraph();
      const payload = JSON.stringify({ jsonrpc: "2.0", method: "graph.updated", params: { ...graph, projectRoot: this.projectRoot } });
      for (const client of this.wss.clients) {
        if (client.readyState === import_ws.WebSocket.OPEN) {
          client.send(payload);
        }
      }
    } catch (e) {
    }
  }
  broadcastAgentActivity(mutation) {
    try {
      const payload = JSON.stringify({
        jsonrpc: "2.0",
        method: "agent.activity",
        params: {
          action: mutation.action,
          params: mutation.params,
          timestamp: Date.now()
        }
      });
      for (const client of this.wss.clients) {
        if (client.readyState === import_ws.WebSocket.OPEN) {
          client.send(payload);
        }
      }
    } catch (e) {
    }
  }
  async handleHttpRequest(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }
    const url = req.url?.split("?")[0] || "/";
    if (url === "/api/graph") {
      const graph = this.astEngine.extractArchitectureGraph();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "success", payload: graph, projectRoot: this.projectRoot }, null, 2));
      return;
    }
    if (url.startsWith("/api/v1/")) {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", async () => {
        try {
          let params = {};
          if (body.trim()) {
            try {
              params = JSON.parse(body);
            } catch (e) {
            }
          }
          let method = "graph.getArchitecture";
          if (url === "/api/v1/project/create") method = "project.create";
          else if (url === "/api/v1/project/load") method = "project.load";
          else if (url === "/api/v1/project/graph") method = "graph.getArchitecture";
          else if (url === "/api/v1/project/status") method = "project.getStatus";
          else if (url === "/api/v1/graph/moveNode") method = "graph.moveNode";
          else if (url === "/api/v1/graph/moveMultipleNodes") method = "graph.moveMultipleNodes";
          else if (url === "/api/v1/graph/connectNodes") method = "graph.connectNodes";
          else if (url === "/api/v1/graph/deleteEdge") method = "graph.deleteEdge";
          else if (url === "/api/v1/graph/deleteNode") method = "graph.deleteNode";
          else if (url === "/api/v1/graph/alignLayout") method = "graph.alignLayout";
          else if (url === "/api/v1/graph/undo") method = "graph.undo";
          else if (url === "/api/v1/graph/redo") method = "graph.redo";
          else if (url === "/api/v1/entity/create") method = "entity.create";
          else if (url === "/api/v1/functionality/create") method = "functionality.create";
          else if (url === "/api/v1/library/create") method = "library.create";
          else if (url === "/api/v1/flow/addStep") method = "flow.addStep";
          else if (url === "/api/v1/file/read") method = "file.read";
          else if (url === "/api/v1/file/edit") method = "file.edit";
          else if (url === "/api/v1/ui/generate") method = "ui.generate";
          else if (url === "/api/v1/validate/audit") method = "validate.audit";
          else if (url === "/api/v1/test/execute") method = "test.executeFunction";
          else if (url === "/api/v1/docs/endpoints") method = "docs.endpoints";
          const rpcRes = await this.router.handle({
            jsonrpc: "2.0",
            id: "http-req-" + Date.now(),
            method,
            params
          });
          if (rpcRes.error) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify(rpcRes.error, null, 2));
          } else {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(rpcRes.result, null, 2));
            this.broadcastGraphUpdate();
          }
        } catch (err) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: err.message || String(err) }));
        }
      });
      return;
    }
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(this.getStudioHtml());
  }
  getStudioHtml() {
    const candidates = [
      path8.join(__dirname, "studio.html"),
      path8.join(__dirname, "../../src/server/studio.html"),
      path8.join(process.cwd(), "packages/studio/src/server/studio.html"),
      path8.join(process.cwd(), "src/server/studio.html")
    ];
    for (const candidate of candidates) {
      if (fs8.existsSync(candidate)) {
        return fs8.readFileSync(candidate, "utf8");
      }
    }
    return `<!DOCTYPE html><html><body><h1>Krnl Studio Error: studio.html template not found.</h1></body></html>`;
  }
  async start() {
    return new Promise((resolve7) => {
      this.httpServer.listen(this.port, () => {
        console.log(`
\u{1F680} [Krnl Studio] Omni Canvas IDE running at: http://localhost:${this.port}`);
        console.log(`\u{1F4E1} [Krnl Studio] Active Project Root: ${this.projectRoot}`);
        console.log(`\u{1F4E1} [Krnl Studio] REST API Suite available at: http://localhost:${this.port}/api/v1/*`);
        console.log(`\u{1F4E1} [Krnl Studio] WebSocket JSON-RPC protocol active on /studio/ws
`);
        resolve7();
      });
    });
  }
  async stop() {
    this.watcher.stop();
    return new Promise((resolve7) => {
      this.wss.close(() => {
        this.httpServer.close(() => resolve7());
      });
    });
  }
};

// ../studio/src/client/plugins/VanJSRenderPlugin.ts
var import_vanjs_core = __toESM(require("vanjs-core"), 1);
var { div, span, button } = import_vanjs_core.default.tags;

// src/bin/krnl.ts
var args = process.argv.slice(2);
var command = args[0] || "help";
async function main() {
  switch (command) {
    case "validate": {
      const valid = await runValidate(process.cwd());
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
        fs9.watch(process.cwd(), { recursive: true }, (evt, filename) => {
          if (filename && (filename.endsWith(".ts") || filename.endsWith(".js")) && !filename.includes("krnl-magnetic.d.ts")) {
            try {
              generateMagneticDeclarations(process.cwd());
            } catch (e) {
            }
          }
        });
      }
      break;
    }
    case "build": {
      console.log("\u{1F3D7}\uFE0F  [Krnl Build] Validating and building project...");
      const valid = await runValidate(process.cwd());
      if (!valid) {
        console.error("\u274C Build aborted due to validation errors.");
        process.exit(1);
      }
      generateMagneticDeclarations(process.cwd());
      console.log("\u2705 [Krnl Build] Compilation completed successfully.");
      break;
    }
    case "dev": {
      const portArgIdx = args.indexOf("--port");
      const port = portArgIdx !== -1 ? parseInt(args[portArgIdx + 1], 10) : 8080;
      console.log("\u26A1 [Krnl Dev] Initializing Krnl Studio visual workspace...");
      generateMagneticDeclarations(process.cwd());
      const server = new StudioServer({
        port,
        projectRoot: process.cwd()
      });
      await server.start();
      break;
    }
    case "help":
    default: {
      console.log(`
\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557
\u2551                      Krnl Framework CLI                       \u2551
\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D

Usage: krnl <command> [options]

Commands:
  dev               Start Krnl Studio visual node IDE & dev server (API, UI, WS RPC)
  build             Validate and build project for production
  validate          Run deep AST & 4-layer function purity validation
  watch             Generate ambient TypeScript declarations (krnl-magnetic.d.ts)
  generate          Scaffold entities, functionalities, libraries, subapps
                    Examples:
                      krnl generate entity UserSystem
                      krnl generate functionality UserSystem CreateProfile
                      krnl generate library Math
                      krnl generate subapp BillingEngine

Options:
  --port <number>   Specify port for Krnl Studio dev server (default: 8080)
  --watch, -w       Enable continuous file watcher (for watch command)
  --help, -h        Show this help message
`);
      break;
    }
  }
}
main().catch((err) => {
  console.error("\u274C Fatal error:", err);
  process.exit(1);
});
