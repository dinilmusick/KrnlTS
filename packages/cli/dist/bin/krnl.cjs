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
            nodes.push({
              id: `library:${baseName}`,
              type: "library",
              name: baseName,
              filePath: libPath
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
            nodes.push({
              id: `subapp:${saName}`,
              type: "subapp",
              name: saName,
              filePath: saPath
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
        const entityNode = {
          id: `entity:${entityName}`,
          type: "entity",
          name: entityName,
          parentEntity: parentName,
          filePath: fs4.existsSync(entityTsFile) ? entityTsFile : entityPath
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
              nodes.push({
                id: `functionality:${entityName}:${fnName}`,
                type: "functionality",
                name: fnName,
                parentEntity: entityName,
                filePath: logicFile,
                helpers,
                uiSpec: fs4.existsSync(path4.join(fnPath, `${fnName}View.ts`))
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
var import_worker_threads = require("worker_threads");
var esbuild = __toESM(require("esbuild"), 1);
var FunctionExecutor = class {
  /**
   * Executes a specific function in an isolated process/worker with performance metrics.
   */
  static async execute(request) {
    const startTime = performance.now();
    const initialMem = process.memoryUsage().heapUsed;
    const logs = [];
    const absPath = path5.resolve(request.filePath);
    if (!fs5.existsSync(absPath)) {
      return {
        success: false,
        durationMs: 0,
        memoryDeltaBytes: 0,
        error: `File not found: ${absPath}`,
        logs: []
      };
    }
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
    let bundledCode = "";
    try {
      const result = await esbuild.build({
        entryPoints: [absPath],
        bundle: true,
        write: false,
        format: "esm",
        platform: "node",
        target: "esnext",
        plugins: [tsResolverPlugin],
        external: ["@dinilmusick/krnl-core", "vanjs-core", "worker_threads", "ws", "fs", "path", "http", "events"]
      });
      if (result.outputFiles && result.outputFiles.length > 0) {
        bundledCode = result.outputFiles[0].text;
      } else {
        throw new Error("esbuild produced no output");
      }
    } catch (err) {
      return {
        success: false,
        durationMs: parseFloat((performance.now() - startTime).toFixed(2)),
        memoryDeltaBytes: 0,
        error: "Bundle error: " + (err?.message || String(err)),
        logs
      };
    }
    const codeBase64 = Buffer.from(bundledCode).toString("base64");
    return new Promise((resolve7) => {
      try {
        const workerCode = `
          const { parentPort, workerData } = require('worker_threads');

          async function run() {
            try {
              const mod = await import('data:text/javascript;base64,' + workerData.codeBase64);

              const fn = workerData.functionName
                ? (mod[workerData.functionName] || mod.default || mod.main)
                : (mod.main || mod.default || mod[Object.keys(mod)[0]]);

              if (typeof fn !== 'function') {
                throw new Error("No executable function export found in " + workerData.absPath);
              }

              const dummyContext = {
                state: workerData.state || {},
                entity: {
                  id: 'TestSandbox',
                  call: async () => ({}),
                  emitEvent: () => {}
                }
              };

              const result = await fn(workerData.input || {}, dummyContext);
              parentPort.postMessage({ success: true, output: result });
            } catch (err) {
              parentPort.postMessage({ success: false, error: err && err.message ? err.message : String(err) });
            }
          }

          run();
        `;
        const worker = new import_worker_threads.Worker(workerCode, {
          eval: true,
          workerData: {
            absPath,
            codeBase64,
            functionName: request.functionName,
            input: request.input,
            state: request.state
          }
        });
        const timer = setTimeout(() => {
          worker.terminate();
          resolve7({
            success: false,
            durationMs: parseFloat((performance.now() - startTime).toFixed(2)),
            memoryDeltaBytes: 0,
            error: "Execution timed out after 5000ms",
            logs
          });
        }, 5e3);
        worker.on("message", (msg) => {
          clearTimeout(timer);
          const durationMs = parseFloat((performance.now() - startTime).toFixed(2));
          const memoryDeltaBytes = Math.max(0, process.memoryUsage().heapUsed - initialMem);
          resolve7({
            success: msg.success,
            output: msg.output,
            error: msg.error,
            durationMs,
            memoryDeltaBytes,
            logs
          });
        });
        worker.on("error", (err) => {
          clearTimeout(timer);
          resolve7({
            success: false,
            durationMs: parseFloat((performance.now() - startTime).toFixed(2)),
            memoryDeltaBytes: 0,
            error: err?.message || String(err),
            logs
          });
        });
      } catch (err) {
        resolve7({
          success: false,
          durationMs: parseFloat((performance.now() - startTime).toFixed(2)),
          memoryDeltaBytes: 0,
          error: err?.message || String(err),
          logs
        });
      }
    });
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
      if (filename.includes("node_modules") || filename.includes("dist") || filename.includes(".git")) return;
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
      }, 150);
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
var import_ws = require("ws");
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
    this.wss = new import_ws.WebSocketServer({ server: this.httpServer, path: "/studio/ws" });
    this.initWebSocket();
    this.initFileWatcher();
  }
  initWebSocket() {
    this.wss.on("connection", (ws) => {
      const initialGraph = this.astEngine.extractArchitectureGraph();
      ws.send(JSON.stringify({ jsonrpc: "2.0", method: "graph.init", params: { ...initialGraph, projectRoot: this.projectRoot } }));
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
          ws.send(JSON.stringify(res));
          if (req.method && (req.method.startsWith("graph.") || req.method.startsWith("entity.") || req.method.startsWith("functionality.") || req.method.startsWith("library."))) {
            this.broadcastGraphUpdate();
          }
        } catch (e) {
          ws.send(JSON.stringify({
            jsonrpc: "2.0",
            error: { code: -32700, message: "Parse error: " + (e.message || String(e)) }
          }));
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
    const graph = this.astEngine.extractArchitectureGraph();
    const payload = JSON.stringify({ jsonrpc: "2.0", method: "graph.updated", params: { ...graph, projectRoot: this.projectRoot } });
    for (const client of this.wss.clients) {
      if (client.readyState === import_ws.WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }
  broadcastAgentActivity(mutation) {
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
  }
  async handleHttpRequest(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
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
      });
      return;
    }
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(this.getStudioHtml());
  }
  getStudioHtml() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Krnl Studio \u2014 Omni Canvas Visual IDE</title>
  
  <!-- Monaco Editor AMD Loader -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs/loader.min.js"></script>

  <style>
    :root {
      --krnl-bg: #0e0e12;
      --krnl-panel: #16161e;
      --krnl-panel-hover: #1f1f2a;
      --krnl-accent: #d4af37;
      --krnl-accent-glow: rgba(212, 175, 55, 0.45);
      --krnl-purple: #c678dd;
      --krnl-purple-glow: rgba(198, 120, 221, 0.45);
      --krnl-blue: #61afef;
      --krnl-text: #f5ede4;
      --krnl-border: 1px solid rgba(212, 175, 55, 0.3);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--krnl-bg);
      color: var(--krnl-text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
      overflow: hidden;
      width: 100vw;
      height: 100vh;
      user-select: none;
    }
    #app { width: 100%; height: 100%; display: flex; flex-direction: column; position: relative; }
    
    /* Header */
    .studio-header {
      position: absolute; top: 12px; left: 16px; right: 16px; z-index: 1000;
      background: rgba(22, 22, 30, 0.94); backdrop-filter: blur(16px);
      border: var(--krnl-border); border-radius: 10px; padding: 8px 16px;
      display: flex; align-items: center; justify-content: space-between;
      font-size: 13px; font-weight: bold; box-shadow: 0 4px 24px rgba(0,0,0,0.7);
    }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #98c379; box-shadow: 0 0 10px #98c379; }

    /* Live Agent Activity Toast */
    #agent-activity-hud {
      position: fixed; top: 60px; left: 16px; z-index: 1500;
      background: rgba(22, 22, 30, 0.98); border: 2px solid #d4af37;
      border-radius: 8px; padding: 10px 18px; display: none; align-items: center; gap: 12px;
      font-size: 13px; color: #d4af37; font-weight: bold;
      box-shadow: 0 6px 28px rgba(0,0,0,0.9), 0 0 16px var(--krnl-accent-glow);
    }

    /* Tooltip Helper */
    .tooltip-container { position: relative; display: inline-flex; align-items: center; justify-content: center; }
    .tooltip-text {
      visibility: hidden; opacity: 0;
      position: absolute; z-index: 10000;
      background: #1e1e28; color: #f5ede4;
      border: 1px solid #d4af37; border-radius: 6px;
      padding: 4px 8px; font-size: 11px; white-space: nowrap;
      box-shadow: 0 4px 14px rgba(0,0,0,0.8);
      pointer-events: none; transition: opacity 0.15s ease, transform 0.15s ease;
    }
    .tooltip-container:hover .tooltip-text { visibility: visible; opacity: 1; }
    .tooltip-bottom { top: 100%; left: 50%; transform: translateX(-50%) translateY(6px); }
    .tooltip-top { bottom: 100%; left: 50%; transform: translateX(-50%) translateY(-6px); }

    /* INFINITE 4-QUADRANT CANVASS VIEWPORT (-INF to +INF) */
    #graph-viewport {
      width: 100%; height: 100%; position: relative; overflow: hidden;
      background-color: #0e0e12;
      background-image: radial-gradient(rgba(212, 175, 55, 0.15) 1px, transparent 1px);
      background-size: 24px 24px; cursor: default;
    }
    #graph-container {
      position: absolute; top: 0; left: 0;
      width: 1px; height: 1px;
      transform-origin: 0 0;
    }
    
    /* 4-Quadrant Unbounded Layers with overflow: visible */
    #svg-wires {
      position: absolute; top: 0; left: 0;
      width: 1px; height: 1px;
      overflow: visible; pointer-events: none; z-index: 5;
    }
    #nodes-layer {
      position: absolute; top: 0; left: 0;
      width: 1px; height: 1px;
      overflow: visible; pointer-events: none; z-index: 10;
    }
    #gizmos-layer {
      position: absolute; top: 0; left: 0;
      width: 1px; height: 1px;
      overflow: visible; pointer-events: none; z-index: 25;
    }

    /* Selection Box */
    #selection-box {
      position: absolute; display: none;
      border: 1px dashed #d4af37; background: rgba(212, 175, 55, 0.12);
      pointer-events: none; z-index: 999;
    }

    /* Base Node Structure */
    .krnl-node {
      position: absolute; border-radius: 12px;
      font-family: inherit; color: var(--krnl-text); cursor: grab;
      box-shadow: 0 10px 30px rgba(0,0,0,0.75);
      transition: box-shadow 0.15s ease, border-color 0.15s ease;
      pointer-events: auto; z-index: 20;
      overflow: visible;
    }
    .krnl-node:hover {
      box-shadow: 0 14px 42px rgba(0,0,0,0.9), 0 0 24px var(--krnl-accent-glow);
    }
    .krnl-node.dragging { cursor: grabbing !important; }
    .krnl-node.selected {
      box-shadow: 0 0 0 2px #f5ede4, 0 14px 42px rgba(0,0,0,0.9), 0 0 28px var(--krnl-accent-glow) !important;
    }

    /* 1. Entity System Nodes */
    .krnl-node-entity {
      background: linear-gradient(180deg, #1d1d28 0%, #13131b 100%);
      border: 2px solid #d4af37; min-width: 290px;
      box-shadow: 0 10px 32px rgba(0,0,0,0.85), inset 0 1px 0 rgba(212, 175, 55, 0.4);
    }
    .node-header-entity {
      background: rgba(212, 175, 55, 0.12);
      border-bottom: 1px solid rgba(212, 175, 55, 0.3);
      padding: 10px 14px; display: flex; align-items: center; justify-content: space-between;
      border-radius: 10px 10px 0 0;
    }

    /* 2. Quad-Unit Functionality Nodes */
    .krnl-node-functionality {
      background: linear-gradient(180deg, #181926 0%, #11121a 100%);
      border: 1px solid #61afef; min-width: 280px;
      box-shadow: 0 8px 28px rgba(0,0,0,0.7), inset 0 1px 0 rgba(97, 175, 239, 0.3);
    }
    .node-header-functionality {
      background: rgba(97, 175, 239, 0.12);
      border-bottom: 1px solid rgba(97, 175, 239, 0.25);
      padding: 9px 14px; display: flex; align-items: center; justify-content: space-between;
      border-radius: 10px 10px 0 0;
    }
    .quad-layers-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 6px;
      padding: 10px 14px; background: rgba(0,0,0,0.25);
      border-top: 1px solid rgba(255,255,255,0.06);
    }
    .quad-pill {
      font-size: 10px; padding: 4px 6px; border-radius: 4px;
      display: flex; align-items: center; gap: 6px; font-weight: 500;
    }

    /* 3. Concept Library Nodes */
    .krnl-node-library {
      background: linear-gradient(180deg, #261f18 0%, #18130e 100%);
      border: 1px solid #e5c07b; min-width: 250px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.75), inset 0 1px 0 rgba(229, 192, 123, 0.3);
    }
    .node-header-library {
      background: rgba(229, 192, 123, 0.14);
      border-bottom: 1px solid rgba(229, 192, 123, 0.3);
      padding: 9px 14px; display: flex; align-items: center; justify-content: space-between;
      border-radius: 10px 10px 0 0;
    }

    /* 4. Sub-App Nodes */
    .krnl-node-subapp {
      background: linear-gradient(180deg, #15222b 0%, #0d151c 100%);
      border: 1px dashed #56b6c2; min-width: 260px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.75), inset 0 1px 0 rgba(86, 182, 194, 0.25);
    }
    .node-header-subapp {
      background: rgba(86, 182, 194, 0.14);
      border-bottom: 1px dashed rgba(86, 182, 194, 0.3);
      padding: 9px 14px; display: flex; align-items: center; justify-content: space-between;
      border-radius: 10px 10px 0 0;
    }

    /* 5. Omni Viewer Widget Nodes */
    .krnl-viewer-node {
      position: absolute; border-radius: 12px;
      background: rgba(22, 22, 30, 0.98); backdrop-filter: blur(20px);
      border: 2px solid #c678dd;
      box-shadow: 0 16px 48px rgba(0,0,0,0.9), 0 0 24px var(--krnl-purple-glow);
      pointer-events: auto; z-index: 50; display: flex; flex-direction: column;
      min-width: 380px; min-height: 280px;
      overflow: hidden;
    }
    .viewer-titlebar {
      background: linear-gradient(90deg, rgba(198, 120, 221, 0.25) 0%, rgba(22, 22, 30, 0.8) 100%);
      border-bottom: 1px solid rgba(198, 120, 221, 0.35);
      padding: 10px 14px; display: flex; align-items: center; justify-content: space-between;
      cursor: move;
    }
    .viewer-body {
      flex: 1; display: flex; flex-direction: column; overflow: hidden; position: relative;
    }
    .viewer-resize-handle {
      position: absolute; right: 0; bottom: 0; width: 18px; height: 18px;
      cursor: nwse-resize; z-index: 100;
      background: linear-gradient(135deg, transparent 50%, #c678dd 50%);
    }

    /* Sockets */
    .node-socket {
      width: 14px; height: 14px; border-radius: 50%;
      background: #d4af37; border: 2px solid #0e0e12;
      position: absolute; cursor: crosshair; pointer-events: auto; z-index: 35;
      transition: transform 0.1s ease, background 0.1s ease;
    }
    .node-socket:hover {
      transform: translateY(-50%) scale(1.35);
      background: #f5ede4; box-shadow: 0 0 12px #d4af37;
    }
    .socket-out { right: -7px; top: 50%; transform: translateY(-50%); }
    .socket-in { left: -7px; top: 50%; transform: translateY(-50%); background: #61afef; }

    /* MONOCHROMATIC 'VIEWS' SOCKET HANDLE */
    .socket-views {
      position: absolute; right: 12px; bottom: -10px;
      width: 26px; height: 26px; border-radius: 50%;
      background: #1e1e28; border: 2px solid #c678dd;
      display: flex; align-items: center; justify-content: center;
      cursor: crosshair; pointer-events: auto; z-index: 40;
      box-shadow: 0 2px 10px rgba(0,0,0,0.8), 0 0 10px var(--krnl-purple-glow);
      transition: transform 0.15s ease, background 0.15s ease;
    }
    .socket-views svg { stroke: #c678dd; transition: stroke 0.15s ease; }
    .socket-views:hover {
      transform: scale(1.25); background: #c678dd;
      box-shadow: 0 0 16px var(--krnl-purple-glow);
    }
    .socket-views:hover svg { stroke: #0e0e12; }

    /* Centered Wire Delete Gizmo */
    .edge-delete-gizmo {
      position: absolute; width: 20px; height: 20px; border-radius: 50%;
      background: #16161e; border: 1px solid #e06c75; color: #e06c75;
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: bold; cursor: pointer; pointer-events: auto;
      transform: translate(-50%, -50%); z-index: 30;
      box-shadow: 0 2px 8px rgba(0,0,0,0.8);
      transition: all 0.15s ease;
    }
    .edge-delete-gizmo:hover {
      background: #e06c75; color: #fff; transform: translate(-50%, -50%) scale(1.25);
      box-shadow: 0 0 12px rgba(224, 108, 117, 0.8);
    }

    /* Context Menus */
    .krnl-context-menu {
      position: fixed; display: none; z-index: 9999;
      background: rgba(22, 22, 30, 0.98); backdrop-filter: blur(16px);
      border: var(--krnl-border); border-radius: 10px; padding: 8px; min-width: 210px;
      box-shadow: 0 12px 36px rgba(0,0,0,0.9), 0 0 14px var(--krnl-accent-glow);
    }
    .menu-item {
      padding: 8px 12px; font-size: 12px; border-radius: 6px; cursor: pointer;
      display: flex; align-items: center; gap: 10px; color: var(--krnl-text);
      transition: background 0.1s ease, color 0.1s ease;
    }
    .menu-item:hover { background: rgba(212, 175, 55, 0.25); color: #d4af37; }
    .menu-separator { height: 1px; background: rgba(212, 175, 55, 0.15); margin: 4px 0; }

    /* STRICT MONOCHROMATIC ICON-ONLY DOCK TOOLBAR */
    .dock-icon-btn {
      width: 38px; height: 38px; border-radius: 8px;
      background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.12);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; color: #f5ede4;
      transition: all 0.15s ease;
    }
    .dock-icon-btn svg { stroke: #d4af37; transition: transform 0.15s ease; }
    .dock-icon-btn:hover {
      background: rgba(212, 175, 55, 0.25); border-color: #d4af37;
      transform: scale(1.12);
      box-shadow: 0 0 14px var(--krnl-accent-glow);
    }
  </style>
</head>
<body>
  <div id="app">
    <!-- Live Agent Activity Toast -->
    <div id="agent-activity-hud">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d4af37" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>
      <span id="agent-hud-text">AI Agent Mutation</span>
    </div>

    <!-- Header -->
    <div class="studio-header">
      <div style="display: flex; align-items: center; gap: 12px;">
        <span class="status-dot"></span>
        <span style="letter-spacing: 1px;">KRNL STUDIO</span>
        <span style="color: var(--krnl-accent);">|</span>
        <span style="color: #abb2bf;">Omni Canvas IDE</span>
      </div>
      <div style="display: flex; align-items: center; gap: 14px;">
        <span id="node-count-badge" style="background: rgba(212, 175, 55, 0.15); color: #d4af37; padding: 3px 8px; border-radius: 4px; font-size: 11px;">0 Nodes</span>
        <span style="font-size: 11px; color: #7f848e;">Project:</span>
        <select id="project-selector" onchange="switchProject(this.value)" style="background: #1e1e28; color: #d4af37; border: var(--krnl-border); padding: 4px 10px; border-radius: 6px; font-size: 11px; cursor: pointer;">
          <option value="examples/unified-workspace" selected>examples/unified-workspace (All Combined)</option>
          <option value="examples/calculator-app">examples/calculator-app</option>
          <option value="examples/ecommerce-app">examples/ecommerce-app</option>
          <option value="examples/ai-agent-app">examples/ai-agent-app</option>
          <option value=".">Framework Root</option>
        </select>
        <div class="tooltip-container">
          <button onclick="triggerPurityAudit()" style="background: rgba(212, 175, 55, 0.2); border: 1px solid #d4af37; color: #d4af37; padding: 4px 10px; border-radius: 6px; font-size: 11px; cursor: pointer; font-weight: bold; display: flex; align-items: center; gap: 6px;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span>Purity Audit</span>
          </button>
          <span class="tooltip-text tooltip-bottom">Run AST 4-Layer Purity Audit</span>
        </div>
      </div>
    </div>

    <!-- Infinite 4-Quadrant Canvas Viewport -->
    <div id="graph-viewport">
      <div id="graph-container">
        <svg id="svg-wires"></svg>
        <div id="nodes-layer"></div>
        <div id="gizmos-layer"></div>
        <div id="selection-box"></div>
      </div>
    </div>

    <!-- STRICT MONOCHROMATIC ICON-ONLY DOCK TOOLBAR -->
    <div style="position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%); display: flex; gap: 10px; background: rgba(22, 22, 30, 0.94); backdrop-filter: blur(16px); border: var(--krnl-border); padding: 8px 14px; border-radius: 14px; box-shadow: 0 8px 32px rgba(0,0,0,0.8); z-index: 2000;">
      <div class="tooltip-container">
        <button class="dock-icon-btn" onclick="resetZoomAndFit()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d4af37" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/></svg>
        </button>
        <span class="tooltip-text tooltip-top">Fit View & Reset Zoom</span>
      </div>
      <div class="tooltip-container">
        <button class="dock-icon-btn" onclick="apiAlignLayout('hierarchical')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d4af37" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        </button>
        <span class="tooltip-text tooltip-top">Auto-Align Hierarchical Layout</span>
      </div>
      <div style="width: 1px; background: rgba(212, 175, 55, 0.2); margin: 4px 0;"></div>
      <div class="tooltip-container">
        <button class="dock-icon-btn" onclick="contextAddEntity()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d4af37" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
        </button>
        <span class="tooltip-text tooltip-top">New System Entity</span>
      </div>
      <div class="tooltip-container">
        <button class="dock-icon-btn" onclick="contextAddFunctionality()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#61afef" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        </button>
        <span class="tooltip-text tooltip-top">New Quad-Unit Functionality</span>
      </div>
      <div class="tooltip-container">
        <button class="dock-icon-btn" onclick="contextAddLibrary()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e5c07b" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
        </button>
        <span class="tooltip-text tooltip-top">New Domain Concept Library</span>
      </div>
    </div>

    <!-- Canvas Context Menu -->
    <div id="pane-context-menu" class="krnl-context-menu">
      <div class="menu-item" onclick="contextAddEntity()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d4af37" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
        <span>New Entity</span>
      </div>
      <div class="menu-item" onclick="contextAddFunctionality()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#61afef" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        <span>New Functionality</span>
      </div>
      <div class="menu-item" onclick="contextAddLibrary()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e5c07b" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
        <span>New Concept Library</span>
      </div>
      <div class="menu-separator"></div>
      <div class="menu-item" onclick="apiAlignLayout('hierarchical')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        <span>Auto-Align Layout</span>
      </div>
      <div class="menu-item" onclick="resetZoomAndFit()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/></svg>
        <span>Fit View</span>
      </div>
    </div>

    <!-- Node Context Menu -->
    <div id="node-context-menu" class="krnl-context-menu">
      <div class="menu-item" onclick="spawnViewerForContext('ui')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c678dd" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
        <span>UI & Atom Builder</span>
      </div>
      <div class="menu-item" onclick="spawnViewerForContext('code')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c678dd" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
        <span>Monaco Source Code</span>
      </div>
      <div class="menu-item" onclick="spawnViewerForContext('test')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c678dd" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        <span>Sandboxed Test Bench</span>
      </div>
      <div class="menu-item" onclick="spawnViewerForContext('state')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c678dd" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
        <span>Reactive State Inspector</span>
      </div>
      <div class="menu-separator"></div>
      <div class="menu-item" onclick="contextDisconnectSelected()" style="color: #e5c07b;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e5c07b" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        <span>Disconnect Wires</span>
      </div>
      <div class="menu-item" onclick="contextDeleteSelected()" style="color: #e06c75;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e06c75" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        <span>Delete Node</span>
      </div>
    </div>

    <!-- STRICT MONOCHROMATIC VIEWS SPAWN DIALOGUE -->
    <div id="view-selector-modal" class="krnl-context-menu" style="border-color: #c678dd; box-shadow: 0 12px 36px rgba(0,0,0,0.95), 0 0 20px var(--krnl-purple-glow); min-width: 240px;">
      <div style="padding: 6px 8px 8px 8px; font-size: 11px; color: #c678dd; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(198, 120, 221, 0.25); margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between;">
        <span>SPAWN OMNI VIEW</span>
        <span id="views-modal-node-title" style="color: #f5ede4; font-size: 10px; background: rgba(198,120,221,0.2); padding: 2px 6px; border-radius: 4px;">Node</span>
      </div>
      <div style="display: flex; flex-direction: column; gap: 4px;">
        <div class="menu-item" onclick="confirmSpawnViewer('ui')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c678dd" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
          <div>
            <div style="font-weight: bold; font-size: 12px;">UI & Atom Builder</div>
            <div style="font-size: 10px; color: #7f848e;">Live preview & VanJS editor</div>
          </div>
        </div>
        <div class="menu-item" onclick="confirmSpawnViewer('code')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c678dd" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
          <div>
            <div style="font-weight: bold; font-size: 12px;">Monaco Source Code</div>
            <div style="font-size: 10px; color: #7f848e;">TypeScript quad-unit code</div>
          </div>
        </div>
        <div class="menu-item" onclick="confirmSpawnViewer('test')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c678dd" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          <div>
            <div style="font-weight: bold; font-size: 12px;">Sandboxed Test Bench</div>
            <div style="font-size: 10px; color: #7f848e;">Input/output execution & latency</div>
          </div>
        </div>
        <div class="menu-item" onclick="confirmSpawnViewer('state')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c678dd" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
          <div>
            <div style="font-weight: bold; font-size: 12px;">Reactive State Inspector</div>
            <div style="font-size: 10px; color: #7f848e;">Live reactive schema viewer</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
    let currentGraph = { nodes: [], edges: [] };
    let selectedNodes = new Set();
    let spawnedViewers = new Map();
    let viewerCounter = 0;
    let maxZIndex = 100;
    let lastModalOpenTime = 0;

    // Viewport Pan & Zoom
    let panX = 40, panY = 70, zoom = 0.85;
    let isPanning = false, startPanX = 0, startPanY = 0;
    let isRightDragPanning = false, rightDragStartX = 0, rightDragStartY = 0, rightDragDist = 0;
    const viewport = document.getElementById('graph-viewport');
    const container = document.getElementById('graph-container');

    // Box Selection State
    let isBoxSelecting = false, boxStartX = 0, boxStartY = 0;
    const selectionBox = document.getElementById('selection-box');

    // Dragging Nodes State
    let isDraggingNode = false;
    let nodeDragMoved = false;
    let draggedNodeId = null;
    let dragStartPos = { x: 0, y: 0 };
    let initialNodePositions = new Map();

    // Dragging / Resizing Viewer Window State
    let isDraggingViewer = false, draggedViewerId = null, viewerDragOffset = { x: 0, y: 0 };
    let isResizingViewer = false, resizedViewerId = null, resizeStartPos = { x: 0, y: 0, w: 0, h: 0 };

    // Wire Dragging State
    let isDraggingWire = false;
    let isDraggingViewsWire = false;
    let wireSource = null;
    let wireDropPos = { x: 0, y: 0 };

    // Context Menus
    const paneMenu = document.getElementById('pane-context-menu');
    const nodeMenu = document.getElementById('node-context-menu');
    const viewSelectorModal = document.getElementById('view-selector-modal');
    let contextTargetNodeId = null;

    function hideContextMenus(e) {
      if (Date.now() - lastModalOpenTime < 250) return;
      if (e && e.target.closest('.krnl-context-menu')) return;
      paneMenu.style.display = 'none';
      nodeMenu.style.display = 'none';
      viewSelectorModal.style.display = 'none';
    }
    window.addEventListener('click', hideContextMenus);

    // --- Mouse Pan & Box Selection ---
    viewport.onmousedown = (e) => {
      hideContextMenus(e);
      const rect = viewport.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      // Middle Click / Space+Drag: Pan
      if (e.button === 1 || (e.button === 0 && e.spaceKey)) {
        isPanning = true;
        startPanX = e.clientX - panX;
        startPanY = e.clientY - panY;
        viewport.style.cursor = 'grabbing';
        e.preventDefault();
        return;
      }

      // Right-Click Drag: Pan fallback
      if (e.button === 2) {
        isRightDragPanning = true;
        rightDragDist = 0;
        rightDragStartX = e.clientX;
        rightDragStartY = e.clientY;
        startPanX = e.clientX - panX;
        startPanY = e.clientY - panY;
        return;
      }

      // Canvas Background: Box Marquee
      if (e.button === 0) {
        const isInteractive = e.target.closest('.krnl-node') || e.target.closest('.krnl-viewer-node') || e.target.closest('.node-socket') || e.target.closest('.socket-views') || e.target.closest('.edge-delete-gizmo');
        if (!isInteractive) {
          if (!e.shiftKey && !e.metaKey && !e.ctrlKey) {
            selectedNodes.clear();
            updateNodeSelectionStyles();
          }
          isBoxSelecting = true;
          boxStartX = (clientX - panX) / zoom;
          boxStartY = (clientY - panY) / zoom;
          selectionBox.style.left = boxStartX + 'px';
          selectionBox.style.top = boxStartY + 'px';
          selectionBox.style.width = '0px';
          selectionBox.style.height = '0px';
          selectionBox.style.display = 'block';
        }
      }
    };

    window.addEventListener('mousemove', (e) => {
      const rect = viewport.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      // Pan
      if (isPanning) {
        panX = e.clientX - startPanX;
        panY = e.clientY - startPanY;
        updateTransform();
        return;
      }
      if (isRightDragPanning) {
        const dx = e.clientX - rightDragStartX;
        const dy = e.clientY - rightDragStartY;
        rightDragDist += Math.abs(dx) + Math.abs(dy);
        panX = e.clientX - startPanX;
        panY = e.clientY - startPanY;
        updateTransform();
        return;
      }

      // Box Selection
      if (isBoxSelecting) {
        const currentX = (clientX - panX) / zoom;
        const currentY = (clientY - panY) / zoom;
        const left = Math.min(boxStartX, currentX);
        const top = Math.min(boxStartY, currentY);
        const width = Math.abs(currentX - boxStartX);
        const height = Math.abs(currentY - boxStartY);

        selectionBox.style.left = left + 'px';
        selectionBox.style.top = top + 'px';
        selectionBox.style.width = width + 'px';
        selectionBox.style.height = height + 'px';

        for (const node of currentGraph.nodes) {
          const el = document.getElementById('node-' + node.id);
          if (el) {
            const nx = parseFloat(el.style.left);
            const ny = parseFloat(el.style.top);
            if (nx + el.offsetWidth >= left && nx <= left + width && ny + el.offsetHeight >= top && ny <= top + height) {
              selectedNodes.add(node.id);
            }
          }
        }
        updateNodeSelectionStyles();
        return;
      }

      // Drag Nodes (Smooth across all negative & positive coordinates)
      if (isDraggingNode) {
        nodeDragMoved = true;
        const dx = (clientX - dragStartPos.x) / zoom;
        const dy = (clientY - dragStartPos.y) / zoom;

        selectedNodes.forEach(nodeId => {
          const init = initialNodePositions.get(nodeId);
          if (init) {
            const el = document.getElementById('node-' + nodeId);
            if (el) {
              el.style.left = Math.round(init.x + dx) + 'px';
              el.style.top = Math.round(init.y + dy) + 'px';
            }
          }
        });
        renderWiresAndGizmos();
        return;
      }

      // Drag Viewer Window
      if (isDraggingViewer && draggedViewerId) {
        const vEl = document.getElementById('viewer-' + draggedViewerId);
        if (vEl) {
          const currentX = (clientX - panX) / zoom;
          const currentY = (clientY - panY) / zoom;
          const newX = Math.round(currentX - viewerDragOffset.x);
          const newY = Math.round(currentY - viewerDragOffset.y);
          vEl.style.left = newX + 'px';
          vEl.style.top = newY + 'px';
          const vData = spawnedViewers.get(draggedViewerId);
          if (vData) { vData.x = newX; vData.y = newY; }
          renderWiresAndGizmos();
        }
        return;
      }

      // Resize Viewer Window
      if (isResizingViewer && resizedViewerId) {
        const vEl = document.getElementById('viewer-' + resizedViewerId);
        if (vEl) {
          const dx = (clientX - resizeStartPos.startX) / zoom;
          const dy = (clientY - resizeStartPos.startY) / zoom;
          const newW = Math.max(380, Math.round(resizeStartPos.w + dx));
          const newH = Math.max(260, Math.round(resizeStartPos.h + dy));
          vEl.style.width = newW + 'px';
          vEl.style.height = newH + 'px';
          const vData = spawnedViewers.get(resizedViewerId);
          if (vData) {
            vData.w = newW; vData.h = newH;
            if (vData.monacoInstance) vData.monacoInstance.layout();
          }
          renderWiresAndGizmos();
        }
        return;
      }

      // Live Wire Dragging
      if (isDraggingWire && wireSource) {
        const currentX = (clientX - panX) / zoom;
        const currentY = (clientY - panY) / zoom;
        drawLiveWire(wireSource.x, wireSource.y, currentX, currentY, isDraggingViewsWire ? '#c678dd' : '#61afef');
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (isPanning) { isPanning = false; viewport.style.cursor = 'default'; }
      if (isRightDragPanning) { isRightDragPanning = false; }
      if (isBoxSelecting) { isBoxSelecting = false; selectionBox.style.display = 'none'; }

      if (isDraggingNode) {
        isDraggingNode = false;
        document.querySelectorAll('.krnl-node').forEach(el => el.classList.remove('dragging'));
        if (nodeDragMoved) {
          const positions = {};
          selectedNodes.forEach(nodeId => {
            const el = document.getElementById('node-' + nodeId);
            if (el) positions[nodeId] = { x: parseFloat(el.style.left), y: parseFloat(el.style.top) };
          });
          apiMoveMultipleNodes(positions);
        }
      }

      if (isDraggingViewer) { isDraggingViewer = false; draggedViewerId = null; }
      if (isResizingViewer) { isResizingViewer = false; resizedViewerId = null; }

      if (isDraggingWire) {
        isDraggingWire = false;
        removeLiveWire();

        const rect = viewport.getBoundingClientRect();
        const clientX = e.clientX - rect.left;
        const clientY = e.clientY - rect.top;
        const dropX = Math.round((clientX - panX) / zoom);
        const dropY = Math.round((clientY - panY) / zoom);

        // Views Wire dropped -> Display View Selector Modal
        if (isDraggingViewsWire && wireSource) {
          isDraggingViewsWire = false;
          wireDropPos = { x: dropX, y: dropY };
          openViewSelectorModalAt(e.clientX, e.clientY, wireSource.nodeId);
          return;
        }

        // Standard flow connection drop
        const elemUnderCursor = document.elementFromPoint(e.clientX, e.clientY);
        if (elemUnderCursor && elemUnderCursor.classList.contains('node-socket')) {
          const targetNodeId = elemUnderCursor.dataset.nodeId;
          const targetSocketType = elemUnderCursor.dataset.socketType;
          if (targetNodeId && targetNodeId !== wireSource.nodeId && wireSource.socketType !== targetSocketType) {
            const src = wireSource.socketType === 'out' ? wireSource.nodeId : targetNodeId;
            const tgt = wireSource.socketType === 'out' ? targetNodeId : wireSource.nodeId;
            apiConnectNodes(src, tgt);
          }
        }
      }
    });

    function openViewSelectorModalAt(screenX, screenY, nodeId) {
      lastModalOpenTime = Date.now();
      const node = currentGraph.nodes.find(n => n.id === nodeId);
      document.getElementById('views-modal-node-title').textContent = node ? node.name : 'Node';
      viewSelectorModal.style.display = 'block';
      viewSelectorModal.style.left = screenX + 'px';
      viewSelectorModal.style.top = screenY + 'px';
    }

    // Zoom on Scroll
    viewport.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = viewport.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const graphX = (mouseX - panX) / zoom;
      const graphY = (mouseY - panY) / zoom;
      const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
      const newZoom = Math.min(Math.max(0.25, zoom * zoomFactor), 2.5);
      panX = mouseX - graphX * newZoom;
      panY = mouseY - graphY * newZoom;
      zoom = newZoom;
      updateTransform();
    }, { passive: false });

    function updateTransform() {
      container.style.transform = \`translate(\${panX}px, \${panY}px) scale(\${zoom})\`;
    }
    updateTransform();

    function resetZoomAndFit() {
      apiAlignLayout('hierarchical');
      panX = 40; panY = 70; zoom = 0.85;
      updateTransform();
    }

    // --- Context Menu Handlers ---
    viewport.oncontextmenu = (e) => {
      e.preventDefault();
      if (rightDragDist > 8) return;
      hideContextMenus();

      const nodeEl = e.target.closest('.krnl-node');
      if (nodeEl) {
        contextTargetNodeId = nodeEl.dataset.nodeId;
        if (!selectedNodes.has(contextTargetNodeId)) {
          selectedNodes.clear();
          selectedNodes.add(contextTargetNodeId);
          updateNodeSelectionStyles();
        }
        nodeMenu.style.display = 'block';
        nodeMenu.style.left = e.clientX + 'px';
        nodeMenu.style.top = e.clientY + 'px';
      } else {
        paneMenu.style.display = 'block';
        paneMenu.style.left = e.clientX + 'px';
        paneMenu.style.top = e.clientY + 'px';
      }
    };

    // --- Hotkeys Matrix ---
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.closest('.monaco-editor')) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        selectedNodes.forEach(nodeId => apiDeleteNode(nodeId));
        selectedNodes.clear();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        currentGraph.nodes.forEach(n => selectedNodes.add(n.id));
        updateNodeSelectionStyles();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) apiRedo();
        else apiUndo();
      }
    });

    // --- Rich Differentiated Node Rendering Engine ---
    function renderGraphNodes(graph) {
      const layer = document.getElementById('nodes-layer');
      layer.innerHTML = '';

      if (!graph.nodes || graph.nodes.length === 0) {
        document.getElementById('node-count-badge').textContent = '0 Nodes (Empty)';
        return;
      }

      document.getElementById('node-count-badge').textContent = \`\${graph.nodes.length} Nodes | \${graph.edges?.length || 0} Wires\`;

      graph.nodes.forEach((node, idx) => {
        let x = node.position?.x;
        let y = node.position?.y;

        if (x === undefined || y === undefined) {
          if (node.type === 'entity') {
            const col = Math.floor(idx / 5);
            const row = idx % 5;
            x = 60 + col * 360;
            y = 60 + row * 240;
          } else if (node.type === 'functionality') {
            const col = Math.floor(idx / 6);
            const row = idx % 6;
            x = 840 + col * 340;
            y = 60 + row * 220;
          } else {
            x = 1580;
            y = 60 + idx * 180;
          }
        }
        createNodeElement(node, x, y, layer);
      });

      // Re-render spawned viewers
      spawnedViewers.forEach(viewer => {
        renderViewerDomElement(viewer, layer);
      });

      renderWiresAndGizmos();
      updateNodeSelectionStyles();
    }

    function createNodeElement(node, x, y, layer) {
      const el = document.createElement('div');
      el.id = 'node-' + node.id;
      el.dataset.nodeId = node.id;
      el.className = 'krnl-node krnl-node-' + node.type;
      el.style.left = x + 'px';
      el.style.top = y + 'px';

      let innerHtml = '';

      // 1. ENTITY SYSTEM NODES (Monochromatic Hexagon/Cube Vector)
      if (node.type === 'entity') {
        const parentBadge = node.parentEntity
          ? \`<span style="background: rgba(212, 175, 55, 0.2); color: #d4af37; padding: 2px 6px; border-radius: 4px; font-size: 10px;">Subsystem of \${node.parentEntity}</span>\`
          : \`<span style="background: rgba(152, 195, 121, 0.2); color: #98c379; padding: 2px 6px; border-radius: 4px; font-size: 10px;">Root Entity</span>\`;

        innerHtml = \`
          <div class="node-header-entity">
            <div style="display: flex; align-items: center; gap: 8px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d4af37" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
              <span style="font-size: 11px; font-weight: bold; color: #d4af37; text-transform: uppercase;">SYSTEM ENTITY</span>
            </div>
            \${parentBadge}
          </div>
          <div style="padding: 12px 14px; display: flex; flex-direction: column; gap: 6px;">
            <div style="font-size: 16px; font-weight: bold; color: #f5ede4;">\${node.name}</div>
            <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
              <span style="font-size: 10px; background: #21212b; color: #abb2bf; padding: 3px 8px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.08);">Auto-Boot</span>
            </div>
          </div>
        \`;
      }

      // 2. QUAD-UNIT FUNCTIONALITY NODES (Monochromatic Bolt Vector)
      else if (node.type === 'functionality') {
        const helperCount = node.helpers?.length || 0;
        innerHtml = \`
          <div class="node-header-functionality">
            <div style="display: flex; align-items: center; gap: 6px;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#61afef" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              <span style="font-size: 10px; font-weight: bold; color: #61afef; text-transform: uppercase;">QUAD-UNIT</span>
            </div>
            <span style="font-size: 10px; background: rgba(97, 175, 239, 0.2); color: #61afef; padding: 2px 6px; border-radius: 4px;">\${node.parentEntity}</span>
          </div>
          <div style="padding: 10px 14px 6px 14px;">
            <div style="font-size: 15px; font-weight: bold; color: #f5ede4; margin-bottom: 2px;">\${node.name}</div>
            <div style="font-size: 9px; color: #7f848e; font-family: monospace;">\${node.filePath.split('/').slice(-2).join('/')}</div>
          </div>
          <div class="quad-layers-grid">
            <div class="quad-pill" style="background: rgba(97, 175, 239, 0.15); color: #61afef; border: 1px solid rgba(97, 175, 239, 0.3);">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
              <span>Atom</span>
            </div>
            <div class="quad-pill" style="background: rgba(212, 175, 55, 0.15); color: #d4af37; border: 1px solid rgba(212, 175, 55, 0.3);">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              <span>Logic</span>
            </div>
            <div class="quad-pill" style="background: rgba(152, 195, 121, 0.15); color: #98c379; border: 1px solid rgba(152, 195, 121, 0.3);">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
              <span>State</span>
            </div>
            <div class="quad-pill" style="background: rgba(198, 120, 221, 0.15); color: #c678dd; border: 1px solid rgba(198, 120, 221, 0.3);">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
              <span>\${helperCount} Helpers</span>
            </div>
          </div>
        \`;
      }

      // 3. DOMAIN CONCEPT LIBRARY NODES (Monochromatic Book Vector)
      else if (node.type === 'library') {
        innerHtml = \`
          <div class="node-header-library">
            <div style="display: flex; align-items: center; gap: 6px;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#e5c07b" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              <span style="font-size: 10px; font-weight: bold; color: #e5c07b; text-transform: uppercase;">CONCEPT LIBRARY</span>
            </div>
            <span style="font-size: 10px; background: rgba(229, 192, 123, 0.2); color: #e5c07b; padding: 2px 6px; border-radius: 4px;">Layer 0 Pure</span>
          </div>
          <div style="padding: 12px 14px; display: flex; flex-direction: column; gap: 4px;">
            <div style="font-size: 15px; font-weight: bold; color: #f5ede4;">\${node.name}</div>
            <div style="font-size: 10px; color: #98c379; margin-top: 2px;">Deterministic Purity</div>
          </div>
        \`;
      }

      // 4. SUB-APP NODES (Monochromatic Window Vector)
      else if (node.type === 'subapp') {
        innerHtml = \`
          <div class="node-header-subapp">
            <div style="display: flex; align-items: center; gap: 6px;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#56b6c2" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
              <span style="font-size: 10px; font-weight: bold; color: #56b6c2; text-transform: uppercase;">SUB-APP CONTAINER</span>
            </div>
            <span style="font-size: 10px; background: rgba(86, 182, 194, 0.2); color: #56b6c2; padding: 2px 6px; border-radius: 4px;">SPA</span>
          </div>
          <div style="padding: 12px 14px; display: flex; flex-direction: column; gap: 4px;">
            <div style="font-size: 15px; font-weight: bold; color: #f5ede4;">\${node.name}</div>
            <div style="font-size: 10px; color: #56b6c2; margin-top: 2px;">Self-Contained UI & API Bundle</div>
          </div>
        \`;
      }

      // Sockets: In/Out and STRICT MONOCHROMATIC 'VIEWS' SOCKET
      innerHtml += \`
        <div class="node-socket socket-out" data-node-id="\${node.id}" data-socket-type="out"></div>
        <div class="node-socket socket-in" data-node-id="\${node.id}" data-socket-type="in"></div>
        <div class="tooltip-container socket-views" data-node-id="\${node.id}" data-socket-type="views">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/></svg>
          <span class="tooltip-text tooltip-bottom">Spawn Omni View</span>
        </div>
      \`;

      el.innerHTML = innerHtml;

      // Node Dragging
      el.onmousedown = (e) => {
        if (e.target.closest('.node-socket') || e.target.closest('.socket-views')) return;
        if (e.button === 0) {
          e.stopPropagation();
          nodeDragMoved = false;
          if (!selectedNodes.has(node.id)) {
            if (!e.shiftKey && !e.metaKey) selectedNodes.clear();
            selectedNodes.add(node.id);
            updateNodeSelectionStyles();
          }
          isDraggingNode = true;
          draggedNodeId = node.id;
          el.classList.add('dragging');
          const rect = viewport.getBoundingClientRect();
          dragStartPos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
          initialNodePositions.clear();
          selectedNodes.forEach(nid => {
            const nEl = document.getElementById('node-' + nid);
            if (nEl) initialNodePositions.set(nid, { x: parseFloat(nEl.style.left), y: parseFloat(nEl.style.top) });
          });
        }
      };

      // In/Out Wire Dragging
      const outSocket = el.querySelector('.socket-out');
      const inSocket = el.querySelector('.socket-in');
      [outSocket, inSocket].forEach(sock => {
        if (sock) {
          sock.onmousedown = (e) => {
            e.stopPropagation();
            isDraggingWire = true;
            isDraggingViewsWire = false;
            const sockRect = sock.getBoundingClientRect();
            const vpRect = viewport.getBoundingClientRect();
            wireSource = {
              nodeId: node.id,
              socketType: sock.dataset.socketType,
              x: (sockRect.left + sockRect.width / 2 - vpRect.left - panX) / zoom,
              y: (sockRect.top + sockRect.height / 2 - vpRect.top - panY) / zoom
            };
          };
        }
      });

      // 'VIEWS' SOCKET HANDLE (Wire Drag AND Click)
      const viewsSocket = el.querySelector('.socket-views');
      if (viewsSocket) {
        viewsSocket.onmousedown = (e) => {
          e.stopPropagation();
          isDraggingWire = true;
          isDraggingViewsWire = true;
          const sockRect = viewsSocket.getBoundingClientRect();
          const vpRect = viewport.getBoundingClientRect();
          wireSource = {
            nodeId: node.id,
            socketType: 'views',
            x: (sockRect.left + sockRect.width / 2 - vpRect.left - panX) / zoom,
            y: (sockRect.top + sockRect.height / 2 - vpRect.top - panY) / zoom
          };
        };

        viewsSocket.onclick = (e) => {
          e.stopPropagation();
          wireSource = { nodeId: node.id, socketType: 'views', x: x + 300, y: y + 50 };
          wireDropPos = { x: x + 360, y: y };
          openViewSelectorModalAt(e.clientX + 10, e.clientY + 10, node.id);
        };
      }

      layer.appendChild(el);
    }

    // --- OMNI VIEWER NODE SPAWNING & WINDOW MANAGEMENT ---
    function confirmSpawnViewer(viewType) {
      hideContextMenus();
      const targetId = wireSource?.nodeId || contextTargetNodeId;
      if (!targetId) return;
      spawnViewerNode(targetId, viewType, wireDropPos.x, wireDropPos.y);
    }

    function spawnViewerForContext(viewType) {
      hideContextMenus();
      if (!contextTargetNodeId) return;
      const el = document.getElementById('node-' + contextTargetNodeId);
      const x = el ? parseFloat(el.style.left) + 380 : 500;
      const y = el ? parseFloat(el.style.top) : 200;
      spawnViewerNode(contextTargetNodeId, viewType, x, y);
    }

    function spawnViewerNode(sourceNodeId, viewType, x, y) {
      const sourceNode = currentGraph.nodes.find(n => n.id === sourceNodeId);
      if (!sourceNode) return;

      const viewerId = 'viewer_' + (++viewerCounter);
      const viewerData = {
        id: viewerId,
        sourceNodeId,
        viewType,
        sourceNode,
        x: x || 400,
        y: y || 200,
        w: viewType === 'ui' ? 620 : 520,
        h: viewType === 'ui' ? 440 : 380,
        monacoInstance: null
      };

      spawnedViewers.set(viewerId, viewerData);
      renderViewerDomElement(viewerData, document.getElementById('nodes-layer'));
      renderWiresAndGizmos();
    }

    function closeViewerNode(viewerId) {
      const vEl = document.getElementById('viewer-' + viewerId);
      if (vEl) vEl.remove();
      spawnedViewers.delete(viewerId);
      renderWiresAndGizmos();
    }

    function renderViewerDomElement(viewer, layer) {
      let vEl = document.getElementById('viewer-' + viewer.id);
      if (!vEl) {
        vEl = document.createElement('div');
        vEl.id = 'viewer-' + viewer.id;
        vEl.className = 'krnl-viewer-node';
        layer.appendChild(vEl);
      }

      vEl.style.left = viewer.x + 'px';
      vEl.style.top = viewer.y + 'px';
      vEl.style.width = viewer.w + 'px';
      vEl.style.height = viewer.h + 'px';

      const nodeName = viewer.sourceNode.name;
      const viewTitle = viewer.viewType === 'ui' ? 'UI & Atom Builder'
        : viewer.viewType === 'code' ? 'Monaco Source Code'
        : viewer.viewType === 'test' ? 'Sandboxed Test Bench'
        : 'Reactive State Inspector';

      vEl.innerHTML = \`
        <div class="viewer-titlebar" id="vtb-\${viewer.id}">
          <div style="display: flex; align-items: center; gap: 8px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c678dd" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
            <span style="font-size: 13px; font-weight: bold; color: #c678dd;">\${viewTitle}</span>
            <span style="font-size: 11px; background: rgba(198, 120, 221, 0.2); color: #c678dd; padding: 2px 6px; border-radius: 4px;">\${nodeName}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <button onclick="closeViewerNode('\${viewer.id}')" style="background: transparent; border: none; color: #abb2bf; cursor: pointer; font-size: 14px; padding: 2px 6px; border-radius: 4px;">\u2715</button>
          </div>
        </div>
        <div class="viewer-body" id="vb-\${viewer.id}"></div>
        <div class="viewer-resize-handle" id="vrh-\${viewer.id}"></div>
      \`;

      vEl.onmousedown = () => { vEl.style.zIndex = ++maxZIndex; };

      const titlebar = vEl.querySelector('#vtb-' + viewer.id);
      titlebar.onmousedown = (e) => {
        if (e.target.tagName === 'BUTTON') return;
        e.stopPropagation();
        isDraggingViewer = true;
        draggedViewerId = viewer.id;
        const rect = viewport.getBoundingClientRect();
        viewerDragOffset = {
          x: (e.clientX - rect.left - panX) / zoom - viewer.x,
          y: (e.clientY - rect.top - panY) / zoom - viewer.y
        };
      };

      const resizeHandle = vEl.querySelector('#vrh-' + viewer.id);
      resizeHandle.onmousedown = (e) => {
        e.stopPropagation();
        isResizingViewer = true;
        resizedViewerId = viewer.id;
        const rect = viewport.getBoundingClientRect();
        resizeStartPos = {
          startX: e.clientX - rect.left,
          startY: e.clientY - rect.top,
          w: viewer.w,
          h: viewer.h
        };
      };

      const body = vEl.querySelector('#vb-' + viewer.id);
      populateViewerContent(viewer, body);
    }

    function populateViewerContent(viewer, containerEl) {
      containerEl.innerHTML = '';

      // A. UI VIEW & ATOM BUILDER
      if (viewer.viewType === 'ui') {
        containerEl.innerHTML = \`
          <div style="display: flex; flex: 1; overflow: hidden;">
            <div style="width: 140px; border-right: 1px solid rgba(198, 120, 221, 0.25); padding: 10px; background: rgba(0,0,0,0.3); display: flex; flex-direction: column; gap: 6px;">
              <span style="font-size: 10px; color: #c678dd; font-weight: bold;">KRNL ATOMS</span>
              <div class="palette-item" draggable="true" ondragstart="event.dataTransfer.setData('text', 'KrnlButton')" style="padding: 6px; border: var(--krnl-border); background: #21212b; border-radius: 4px; cursor: grab; font-size: 11px;">Button</div>
              <div class="palette-item" draggable="true" ondragstart="event.dataTransfer.setData('text', 'KrnlTextInput')" style="padding: 6px; border: var(--krnl-border); background: #21212b; border-radius: 4px; cursor: grab; font-size: 11px;">TextInput</div>
              <div class="palette-item" draggable="true" ondragstart="event.dataTransfer.setData('text', 'KrnlTile')" style="padding: 6px; border: var(--krnl-border); background: #21212b; border-radius: 4px; cursor: grab; font-size: 11px;">Tile</div>
            </div>
            <div style="flex: 1; display: flex; flex-direction: column; padding: 12px; gap: 10px; overflow: hidden;">
              <div id="drop-target-\${viewer.id}" ondragover="event.preventDefault()" ondrop="handleViewerAtomDrop(event, '\${viewer.id}')" style="flex: 1; border: 1px dashed rgba(198, 120, 221, 0.4); border-radius: 8px; padding: 12px; background: rgba(0,0,0,0.2); display: flex; flex-direction: column; gap: 6px; overflow-y: auto;">
                <div style="margin: auto; font-size: 11px; color: #7f848e;">Drag atoms here to compose view</div>
              </div>
              <div style="height: 120px; border: 1px solid rgba(198, 120, 221, 0.2); border-radius: 6px; overflow: hidden;" id="monaco-ui-\${viewer.id}"></div>
            </div>
          </div>
        \`;

        setTimeout(() => {
          if (window.monaco) {
            viewer.monacoInstance = monaco.editor.create(document.getElementById('monaco-ui-' + viewer.id), {
              value: \`// Generated VanJS UI for \${viewer.sourceNode.name}\\nimport van from 'vanjs-core';\\nimport { KrnlTile } from '@dinilmusick/krnl-ui';\\n\\nexport function \${viewer.sourceNode.name}View() {\\n  return KrnlTile({ title: '\${viewer.sourceNode.name}' });\\n}\`,
              language: 'typescript', theme: 'krnl-dark', readOnly: true, fontSize: 11, minimap: { enabled: false }
            });
          }
        }, 50);
      }

      // B. MONACO SOURCE CODE (ROBUST DISK LOADING)
      else if (viewer.viewType === 'code') {
        const monacoDiv = document.createElement('div');
        monacoDiv.style.width = '100%'; monacoDiv.style.height = '100%';
        containerEl.appendChild(monacoDiv);

        setTimeout(async () => {
          if (window.monaco) {
            viewer.monacoInstance = monaco.editor.create(monacoDiv, {
              value: \`// Loading source code for \${viewer.sourceNode.name}...\`,
              language: 'typescript',
              theme: 'krnl-dark',
              automaticLayout: true,
              fontSize: 12,
              minimap: { enabled: true }
            });

            try {
              const res = await fetch('/api/v1/file/read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filePath: viewer.sourceNode.filePath })
              });
              const data = await res.json();
              if (data.payload?.content) {
                viewer.monacoInstance.setValue(data.payload.content);
              } else if (data.result?.payload?.content) {
                viewer.monacoInstance.setValue(data.result.payload.content);
              } else if (data.content) {
                viewer.monacoInstance.setValue(data.content);
              } else {
                viewer.monacoInstance.setValue(\`// File: \${viewer.sourceNode.filePath}\\n// Status: No content returned\`);
              }
            } catch (err) {
              viewer.monacoInstance.setValue(\`// Error loading file: \${err.message || String(err)}\`);
            }
          }
        }, 50);
      }

      // C. SANDBOXED TEST BENCH
      else if (viewer.viewType === 'test') {
        containerEl.innerHTML = \`
          <div style="padding: 12px; display: flex; flex-direction: column; gap: 8px; height: 100%;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 11px; color: #abb2bf;">INPUT PAYLOAD:</span>
              <button onclick="executeViewerTest('\${viewer.id}')" style="background: #c678dd; color: #121212; border: none; padding: 4px 12px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 11px;">\u25B6 Execute in Sandbox</button>
            </div>
            <div id="test-in-\${viewer.id}" style="height: 100px; border: 1px solid rgba(198, 120, 221, 0.3); border-radius: 6px;"></div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
              <span style="font-size: 11px; color: #abb2bf;">OUTPUT & BENCHMARK:</span>
              <span id="test-badge-\${viewer.id}" style="font-size: 10px; color: #98c379; font-weight: bold;"></span>
            </div>
            <div id="test-out-\${viewer.id}" style="flex: 1; border: 1px solid rgba(198, 120, 221, 0.3); border-radius: 6px;"></div>
          </div>
        \`;

        setTimeout(() => {
          if (window.monaco) {
            viewer.testInputEditor = monaco.editor.create(document.getElementById('test-in-' + viewer.id), {
              value: '{\\n  "symbol": "BTC/USDT",\\n  "limitPrice": 64500\\n}',
              language: 'json', theme: 'krnl-dark', fontSize: 11, minimap: { enabled: false }
            });
            viewer.testOutputEditor = monaco.editor.create(document.getElementById('test-out-' + viewer.id), {
              value: '// Awaiting execution...',
              language: 'json', theme: 'krnl-dark', readOnly: true, fontSize: 11, minimap: { enabled: false }
            });
          }
        }, 50);
      }

      // D. STATE INSPECTOR
      else if (viewer.viewType === 'state') {
        const monacoDiv = document.createElement('div');
        monacoDiv.style.width = '100%'; monacoDiv.style.height = '100%';
        containerEl.appendChild(monacoDiv);

        setTimeout(() => {
          if (window.monaco) {
            viewer.monacoInstance = monaco.editor.create(monacoDiv, {
              value: JSON.stringify({ active: true, invocationCount: 14, lastUpdated: Date.now() }, null, 2),
              language: 'json', theme: 'krnl-dark', fontSize: 12, minimap: { enabled: false }
            });
          }
        }, 50);
      }
    }

    function handleViewerAtomDrop(e, viewerId) {
      e.preventDefault();
      const atom = e.dataTransfer.getData('text');
      const target = document.getElementById('drop-target-' + viewerId);
      if (atom && target) {
        const item = document.createElement('div');
        item.style.cssText = 'padding: 6px 10px; background: #21212b; border: 1px solid #c678dd; border-radius: 4px; font-size: 11px; display: flex; justify-content: space-between;';
        item.innerHTML = \`<span>\${atom}</span><span style="color: #98c379;">Bound</span>\`;
        target.appendChild(item);
      }
    }

    async function executeViewerTest(viewerId) {
      const viewer = spawnedViewers.get(viewerId);
      if (!viewer || !viewer.testInputEditor) return;
      let inputVal = {};
      try { inputVal = JSON.parse(viewer.testInputEditor.getValue()); } catch (e) { alert('Invalid JSON: ' + e.message); return; }

      const res = await fetch('/api/v1/test/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: viewer.sourceNode.filePath, input: inputVal })
      });
      const data = await res.json();
      if (data.payload) {
        const badge = document.getElementById('test-badge-' + viewerId);
        if (badge) badge.textContent = \`[\${data.payload.durationMs}ms | \${data.payload.success ? 'PASSED' : 'FAILED'}]\`;
        if (viewer.testOutputEditor) viewer.testOutputEditor.setValue(JSON.stringify(data.payload.output || data.payload.error, null, 2));
      }
    }

    function updateNodeSelectionStyles() {
      document.querySelectorAll('.krnl-node').forEach(el => {
        if (selectedNodes.has(el.dataset.nodeId)) el.classList.add('selected');
        else el.classList.remove('selected');
      });
    }

    function renderWiresAndGizmos() {
      const svg = document.getElementById('svg-wires');
      const gizmosLayer = document.getElementById('gizmos-layer');
      svg.innerHTML = '';
      gizmosLayer.innerHTML = '';

      // Standard Flow Connections
      for (const edge of currentGraph.edges || []) {
        const sEl = document.getElementById('node-' + edge.source);
        const tEl = document.getElementById('node-' + edge.target);

        if (sEl && tEl) {
          const sx = parseFloat(sEl.style.left) + sEl.offsetWidth;
          const sy = parseFloat(sEl.style.top) + sEl.offsetHeight / 2;
          const tx = parseFloat(tEl.style.left);
          const ty = parseFloat(tEl.style.top) + tEl.offsetHeight / 2;

          const dx = Math.abs(tx - sx) * 0.5;
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', \`M \${sx} \${sy} C \${sx + dx} \${sy}, \${tx - dx} \${ty}, \${tx} \${ty}\`);
          path.setAttribute('stroke', '#d4af37');
          path.setAttribute('stroke-width', '2');
          path.setAttribute('fill', 'none');
          path.setAttribute('stroke-dasharray', edge.type === 'contains' ? 'none' : '4,4');
          path.setAttribute('opacity', '0.75');
          svg.appendChild(path);

          if (edge.deletable !== false) {
            const midX = (sx + tx) / 2;
            const midY = (sy + ty) / 2;
            const gizmo = document.createElement('div');
            gizmo.className = 'edge-delete-gizmo';
            gizmo.style.left = midX + 'px';
            gizmo.style.top = midY + 'px';
            gizmo.innerHTML = '\u2715';
            gizmo.title = 'Delete Connection';
            gizmo.onclick = (e) => { e.stopPropagation(); apiDeleteEdge(edge.id); };
            gizmosLayer.appendChild(gizmo);
          }
        }
      }

      // TETHERING 'VIEWS' WIRES
      spawnedViewers.forEach(viewer => {
        const sEl = document.getElementById('node-' + viewer.sourceNodeId);
        const vEl = document.getElementById('viewer-' + viewer.id);
        if (sEl && vEl) {
          const viewsSock = sEl.querySelector('.socket-views');
          const sx = parseFloat(sEl.style.left) + (viewsSock ? sEl.offsetWidth - 20 : sEl.offsetWidth);
          const sy = parseFloat(sEl.style.top) + sEl.offsetHeight;
          const tx = parseFloat(vEl.style.left);
          const ty = parseFloat(vEl.style.top) + 20;

          const dy = Math.abs(ty - sy) * 0.5;
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', \`M \${sx} \${sy} C \${sx} \${sy + dy}, \${tx - 40} \${ty}, \${tx} \${ty}\`);
          path.setAttribute('stroke', '#c678dd');
          path.setAttribute('stroke-width', '2.5');
          path.setAttribute('stroke-dasharray', '5,5');
          path.setAttribute('fill', 'none');
          path.setAttribute('opacity', '0.85');
          svg.appendChild(path);

          const midX = (sx + tx) / 2;
          const midY = (sy + ty) / 2;
          const gizmo = document.createElement('div');
          gizmo.className = 'edge-delete-gizmo';
          gizmo.style.left = midX + 'px';
          gizmo.style.top = midY + 'px';
          gizmo.style.borderColor = '#c678dd';
          gizmo.style.color = '#c678dd';
          gizmo.innerHTML = '\u2715';
          gizmo.title = 'Close Viewer';
          gizmo.onclick = (e) => { e.stopPropagation(); closeViewerNode(viewer.id); };
          gizmosLayer.appendChild(gizmo);
        }
      });
    }

    function drawLiveWire(sx, sy, tx, ty, color = '#61afef') {
      let livePath = document.getElementById('live-drag-wire');
      const svg = document.getElementById('svg-wires');
      if (!livePath) {
        livePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        livePath.id = 'live-drag-wire';
        livePath.setAttribute('stroke-width', '3');
        livePath.setAttribute('stroke-dasharray', '6,6');
        livePath.setAttribute('fill', 'none');
        svg.appendChild(livePath);
      }
      livePath.setAttribute('stroke', color);
      const dx = Math.abs(tx - sx) * 0.5;
      livePath.setAttribute('d', \`M \${sx} \${sy} C \${sx + dx} \${sy}, \${tx - dx} \${ty}, \${tx} \${ty}\`);
    }

    function removeLiveWire() {
      const livePath = document.getElementById('live-drag-wire');
      if (livePath) livePath.remove();
    }

    // --- Programmatic API Handlers ---
    function apiMoveMultipleNodes(positions) {
      if (window.studioWs) window.studioWs.send(JSON.stringify({ jsonrpc: '2.0', id: 'move-' + Date.now(), method: 'graph.moveMultipleNodes', params: { positions } }));
    }
    function apiConnectNodes(source, target) {
      if (window.studioWs) window.studioWs.send(JSON.stringify({ jsonrpc: '2.0', id: 'conn-' + Date.now(), method: 'graph.connectNodes', params: { source, target, type: 'contains' } }));
    }
    function apiDeleteEdge(edgeId) {
      if (window.studioWs) window.studioWs.send(JSON.stringify({ jsonrpc: '2.0', id: 'del-edge-' + Date.now(), method: 'graph.deleteEdge', params: { edgeId } }));
    }
    function apiDeleteNode(nodeId) {
      if (window.studioWs) window.studioWs.send(JSON.stringify({ jsonrpc: '2.0', id: 'del-node-' + Date.now(), method: 'graph.deleteNode', params: { nodeId } }));
    }
    function apiAlignLayout(algorithm = 'hierarchical') {
      if (window.studioWs) window.studioWs.send(JSON.stringify({ jsonrpc: '2.0', id: 'align-' + Date.now(), method: 'graph.alignLayout', params: { algorithm } }));
    }
    function apiUndo() {
      if (window.studioWs) window.studioWs.send(JSON.stringify({ jsonrpc: '2.0', id: 'undo-' + Date.now(), method: 'graph.undo', params: {} }));
    }
    function apiRedo() {
      if (window.studioWs) window.studioWs.send(JSON.stringify({ jsonrpc: '2.0', id: 'redo-' + Date.now(), method: 'graph.redo', params: {} }));
    }

    function contextAddEntity() {
      const name = prompt('Enter Entity Name:');
      if (name && window.studioWs) window.studioWs.send(JSON.stringify({ jsonrpc: '2.0', id: 'c-ent-' + Date.now(), method: 'entity.create', params: { name } }));
    }
    function contextAddFunctionality() {
      const entityName = prompt('Enter Parent Entity Name:');
      const name = prompt('Enter Functionality Name:');
      if (entityName && name && window.studioWs) window.studioWs.send(JSON.stringify({ jsonrpc: '2.0', id: 'c-fn-' + Date.now(), method: 'functionality.create', params: { entityName, name } }));
    }
    function contextAddLibrary() {
      const name = prompt('Enter Concept Library Name:');
      if (name && window.studioWs) window.studioWs.send(JSON.stringify({ jsonrpc: '2.0', id: 'c-lib-' + Date.now(), method: 'library.create', params: { name } }));
    }

    function switchProject(relPath) {
      if (window.studioWs) window.studioWs.send(JSON.stringify({ jsonrpc: '2.0', id: 'switch-' + Date.now(), method: 'project.switch', params: { path: relPath } }));
    }
    function triggerPurityAudit() {
      if (window.studioWs) window.studioWs.send(JSON.stringify({ jsonrpc: '2.0', id: 'audit-' + Date.now(), method: 'validate.runPurityAudit' }));
    }

    async function initialGraphFetch() {
      try {
        const res = await fetch('/api/graph');
        const data = await res.json();
        if (data.payload && data.payload.nodes) {
          currentGraph = data.payload;
          renderGraphNodes(currentGraph);
        }
      } catch (e) {}
    }
    initialGraphFetch();

    function connectWebSocket() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(protocol + '//' + window.location.host + '/studio/ws');
      ws.onmessage = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.method === 'graph.init' || msg.method === 'graph.updated') {
          currentGraph = msg.params;
          renderGraphNodes(currentGraph);
        } else if (msg.method === 'agent.activity') {
          showAgentHud(msg.params);
        }
      };
      ws.onclose = () => setTimeout(connectWebSocket, 2000);
      window.studioWs = ws;
    }
    connectWebSocket();

    function showAgentHud(activity) {
      const hud = document.getElementById('agent-activity-hud');
      const text = document.getElementById('agent-hud-text');
      text.textContent = \`AI Agent executed \${activity.action} (\${new Date(activity.timestamp).toLocaleTimeString()})\`;
      hud.style.display = 'flex';
      setTimeout(() => { hud.style.display = 'none'; }, 4000);
    }

    if (window.require) {
      require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' } });
      require(['vs/editor/editor.main'], function () {
        monaco.editor.defineTheme('krnl-dark', {
          base: 'vs-dark', inherit: true,
          rules: [
            { token: 'keyword', foreground: 'd4af37', fontStyle: 'bold' },
            { token: 'string', foreground: '98c379' },
            { token: 'number', foreground: 'd19a66' },
            { token: 'comment', foreground: '5c6370', fontStyle: 'italic' },
            { token: 'type', foreground: 'e5c07b' },
            { token: 'identifier', foreground: 'f5ede4' }
          ],
          colors: {
            'editor.background': '#16161e',
            'editor.foreground': '#f5ede4',
            'editor.lineHighlightBackground': '#1f1f2a',
            'editorLineNumber.foreground': '#5c6370',
            'editorLineNumber.activeForeground': '#d4af37',
            'editorCursor.foreground': '#d4af37',
            'editor.selectionBackground': '#2d3139',
            'editorWidget.background': '#16161e',
            'editorWidget.border': '#c678dd'
          }
        });
      });
    }
  </script>
</body>
</html>`;
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
