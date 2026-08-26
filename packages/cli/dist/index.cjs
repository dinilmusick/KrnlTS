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

// src/commands/validate.ts
var import_krnl_validate = require("@dinilmusick/krnl-validate");
async function runValidate(projectRoot = process.cwd()) {
  console.log(`
\u{1F50D} [Krnl Validate] Scanning project at: ${projectRoot}
`);
  const validator = new import_krnl_validate.KrnlValidatorEngine({ projectRoot });
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
var fs = __toESM(require("fs"), 1);
var path = __toESM(require("path"), 1);
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
  const entityDir = path.join(projectRoot, "src", "entities", name);
  fs.mkdirSync(entityDir, { recursive: true });
  fs.mkdirSync(path.join(entityDir, "functionalities"), { recursive: true });
  const entityFile = path.join(entityDir, `${name}.ts`);
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
  fs.writeFileSync(entityFile, content);
  console.log(`\u2705 Created Entity: src/entities/${name}/${name}.ts`);
}
function generateFunctionality(name, entityName, projectRoot) {
  const funcDir = path.join(projectRoot, "src", "entities", entityName, "functionalities", name);
  fs.mkdirSync(path.join(funcDir, "main_function"), { recursive: true });
  fs.mkdirSync(path.join(funcDir, "state_data"), { recursive: true });
  fs.mkdirSync(path.join(funcDir, "helper_functions"), { recursive: true });
  fs.mkdirSync(path.join(funcDir, "events"), { recursive: true });
  fs.writeFileSync(path.join(funcDir, `${name}Atom.ts`), `export interface ${name}Input {
  message?: string;
}

export interface ${name}Output {
  success: boolean;
  timestamp: number;
}
`);
  fs.writeFileSync(path.join(funcDir, "main_function", "logic.ts"), `import { ${name}Input, ${name}Output } from '../${name}Atom.js';
import { formatTimestamp } from '../helper_functions/formatTimestamp.js';

export const main = async (input: ${name}Input, { state, entity }: any): Promise<${name}Output> => {
  const timestamp = formatTimestamp();
  return {
    success: true,
    timestamp
  };
};
`);
  fs.writeFileSync(path.join(funcDir, "state_data", "state.ts"), `export interface ${name}State {
  executionCount: number;
}

export const initialState: ${name}State = {
  executionCount: 0
};
`);
  fs.writeFileSync(path.join(funcDir, "helper_functions", "formatTimestamp.ts"), `export function formatTimestamp(): number {
  return Date.now();
}
`);
  console.log(`\u2705 Created Quad-Unit Functionality: src/entities/${entityName}/functionalities/${name}/`);
}
function generateLibrary(name, projectRoot) {
  const libDir = path.join(projectRoot, "src", "libraries");
  fs.mkdirSync(libDir, { recursive: true });
  const fileName = `${name}Concepts.ts`;
  fs.writeFileSync(path.join(libDir, fileName), `/**
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
  const subappDir = path.join(projectRoot, "src", "subapps", name);
  fs.mkdirSync(subappDir, { recursive: true });
  fs.writeFileSync(path.join(subappDir, "subapp.json"), JSON.stringify({
    name,
    version: "1.0.0",
    description: `${name} self-contained sub-app`,
    registrationEntry: "./register.js"
  }, null, 2));
  fs.writeFileSync(path.join(subappDir, "register.ts"), `export function register(context: any) {
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
var fs2 = __toESM(require("fs"), 1);
var path2 = __toESM(require("path"), 1);
function generateMagneticDeclarations(projectRoot = process.cwd()) {
  const functionalities = scanDirectory(projectRoot);
  let dtsContent = `// Automatically generated by Krnl Magnetic Watcher. Do not edit manually.

`;
  dtsContent += `import { Entity } from '@dinilmusick/krnl-core';

`;
  const globalDeclarations = [];
  for (const func of functionalities) {
    const helpersDir = path2.join(func.funcPath, "helper_functions");
    if (fs2.existsSync(helpersDir)) {
      const files = fs2.readdirSync(helpersDir);
      for (const file of files) {
        if (file.endsWith(".js") || file.endsWith(".ts")) {
          const filePath = path2.join(helpersDir, file);
          const baseName = path2.basename(file, path2.extname(file));
          const importPath = `./${path2.relative(projectRoot, filePath).replace(/\\/g, "/")}`;
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
    const eventsDir = path2.join(func.funcPath, "events");
    if (fs2.existsSync(eventsDir)) {
      const files = fs2.readdirSync(eventsDir);
      for (const file of files) {
        if (file.endsWith(".js") || file.endsWith(".ts")) {
          const filePath = path2.join(eventsDir, file);
          const baseName = path2.basename(file, path2.extname(file));
          const importPath = `./${path2.relative(projectRoot, filePath).replace(/\\/g, "/")}`;
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
  const outPath = path2.join(projectRoot, "krnl-magnetic.d.ts");
  fs2.writeFileSync(outPath, dtsContent);
  console.log(`[Krnl Watch] Updated ambient declarations: ${outPath}`);
}
function scanDirectory(dir, results = []) {
  if (!fs2.existsSync(dir)) return results;
  const list = fs2.readdirSync(dir, { withFileTypes: true });
  for (const entry of list) {
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".git") continue;
      const fullPath = path2.join(dir, entry.name);
      if (entry.name === "functionalities") {
        const funcs = fs2.readdirSync(fullPath, { withFileTypes: true });
        for (const f of funcs) {
          if (f.isDirectory()) {
            results.push({ funcPath: path2.join(fullPath, f.name), funcName: f.name });
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
  const content = fs2.readFileSync(filePath, "utf8");
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
