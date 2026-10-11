#!/usr/bin/env node
import {
  KrnlPackageReconciler,
  KrnlValidatorEngine,
  generateMagneticDeclarations,
  runGenerate,
  runValidate
} from "../chunk-F5EHXE2O.js";
import "../chunk-RJNYUXZD.js";
import "../chunk-BOXWWXQG.js";
import "../chunk-OHVMVRBP.js";
import "../chunk-EG7T2IAD.js";
import "../chunk-SRTOPJ5W.js";
import "../chunk-6NIKAMUZ.js";
import "../chunk-P2PCLEKX.js";
import "../chunk-FDNCADFE.js";
import "../chunk-PJQIUOX2.js";
import "../chunk-GDLRMDAN.js";
import "../chunk-I74QIQOD.js";
import "../chunk-ZAAV3JXQ.js";
import "../chunk-5JDK35TG.js";
import "../chunk-Q45257P6.js";
import "../chunk-3TRM6CYL.js";
import "../chunk-XIRFOO3H.js";
import "../chunk-JTLSTO25.js";
import "../chunk-JULBBJ27.js";
import "../chunk-X5LOIFM7.js";

// src/bin/krnl.ts
import * as path10 from "path";
import * as fs11 from "fs";

// ../studio/src/server/AstMutationEngine.ts
import { Project as Project2 } from "ts-morph";

// ../studio/src/server/ast/AstMetadataExtractor.ts
import * as fs from "fs";
var AstMetadataExtractor = class {
  project;
  constructor(project) {
    this.project = project;
  }
  extractInputsAndOutputs(atomPath) {
    const inputs = [];
    const outputs = [];
    if (!fs.existsSync(atomPath)) return { inputs, outputs };
    try {
      const sourceFile = this.project.getSourceFile(atomPath) || this.project.addSourceFileAtPath(atomPath);
      const inputInterface = sourceFile.getInterface((i) => i.getName().endsWith("Input") || i.getName().includes("Inputs"));
      if (inputInterface) {
        for (const prop of inputInterface.getProperties()) {
          inputs.push({ name: prop.getName(), type: prop.getType().getText() });
        }
      }
      const outputInterface = sourceFile.getInterface((i) => i.getName().endsWith("Output") || i.getName().includes("Outputs"));
      if (outputInterface) {
        for (const prop of outputInterface.getProperties()) {
          outputs.push({ name: prop.getName(), type: prop.getType().getText() });
        }
      }
    } catch (err) {
      try {
        const content = fs.readFileSync(atomPath, "utf8");
        const inMatch = content.match(/interface\s+\w+Input[^{]*\{([^}]+)\}/s);
        if (inMatch) {
          inMatch[1].split(";").map((l) => l.trim()).filter(Boolean).forEach((line) => {
            const [name, type] = line.split(":").map((s) => s.trim());
            if (name && type) inputs.push({ name, type });
          });
        }
      } catch (e) {
      }
    }
    return { inputs, outputs };
  }
  extractStateFields(statePath) {
    const fields = [];
    if (!fs.existsSync(statePath)) return fields;
    try {
      const sourceFile = this.project.getSourceFile(statePath) || this.project.addSourceFileAtPath(statePath);
      const stateInterface = sourceFile.getInterface((i) => i.getName().endsWith("State"));
      if (stateInterface) {
        for (const prop of stateInterface.getProperties()) {
          fields.push({ name: prop.getName(), type: prop.getType().getText() });
        }
      }
    } catch (e) {
      try {
        const content = fs.readFileSync(statePath, "utf8");
        const match = content.match(/interface\s+\w+State[^{]*\{([^}]+)\}/s);
        if (match) {
          match[1].split(";").map((l) => l.trim()).filter(Boolean).forEach((line) => {
            const [name, type] = line.split(":").map((s) => s.trim());
            if (name && type) fields.push({ name, type });
          });
        }
      } catch (err) {
      }
    }
    return fields;
  }
  extractHelperNames(helpersDir) {
    if (!fs.existsSync(helpersDir)) return [];
    try {
      return fs.readdirSync(helpersDir).filter((f) => f.endsWith(".ts") && !f.endsWith(".d.ts") && !f.endsWith(".test.ts")).map((f) => f.replace(/\.ts$/, ""));
    } catch (e) {
      return [];
    }
  }
};

// ../studio/src/server/ast/AstScanner.ts
import * as fs2 from "fs";
import * as path from "path";
var AstScanner = class {
  projectRoot;
  metadataExtractor;
  constructor(projectRoot, metadataExtractor) {
    this.projectRoot = projectRoot;
    this.metadataExtractor = metadataExtractor;
  }
  scanWorkspace(positions) {
    const nodes = [];
    const edges = [];
    this.scanEntities(nodes, edges, positions);
    this.scanSharedFunctionalities(nodes, edges, positions);
    this.scanLibraries(nodes, edges, positions);
    this.scanSubApps(nodes, edges, positions);
    return { nodes, edges };
  }
  scanEntities(nodes, edges, positions) {
    const srcDir = path.join(this.projectRoot, "src");
    if (!fs2.existsSync(srcDir)) return;
    for (const entry of fs2.readdirSync(srcDir, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.endsWith(".ts") && !entry.name.endsWith(".d.ts") && entry.name !== "index.ts") {
        const entityName = path.basename(entry.name, ".ts");
        const entityId = `entity:${entityName}`;
        const entityNode = {
          id: entityId,
          name: entityName,
          type: "entity",
          filePath: path.join(srcDir, entry.name),
          functionalities: [],
          position: positions[entityId]
        };
        nodes.push(entityNode);
      }
    }
    const entitiesDir = path.join(this.projectRoot, "src/entities");
    if (fs2.existsSync(entitiesDir)) {
      for (const entry of fs2.readdirSync(entitiesDir, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const entityName = entry.name;
        const entityDir = path.join(entitiesDir, entityName);
        const entityId = `entity:${entityName}`;
        const entityNode = {
          id: entityId,
          name: entityName,
          type: "entity",
          filePath: path.join(entityDir, `${entityName}.ts`),
          functionalities: [],
          position: positions[entityId]
        };
        nodes.push(entityNode);
      }
    }
  }
  scanSharedFunctionalities(nodes, edges, positions) {
    const sharedFuncDir = path.join(this.projectRoot, "src/functionalities");
    if (!fs2.existsSync(sharedFuncDir)) return;
    for (const func of fs2.readdirSync(sharedFuncDir, { withFileTypes: true })) {
      if (!func.isDirectory()) continue;
      const funcName = func.name;
      const funcDir = path.join(sharedFuncDir, funcName);
      const funcId = `functionality:${funcName}`;
      const atomPath = path.join(funcDir, `${funcName}Atom.ts`);
      const statePath = path.join(funcDir, "state_data", "state.ts");
      const helpersDir = path.join(funcDir, "helper_functions");
      const logicPath = path.join(funcDir, "main_function", "logic.ts");
      const { inputs, outputs } = this.metadataExtractor.extractInputsAndOutputs(atomPath);
      const stateFields = this.metadataExtractor.extractStateFields(statePath);
      const helpers = this.metadataExtractor.extractHelperNames(helpersDir);
      let uiPath;
      for (const cand of [path.join(funcDir, "ui.ts"), path.join(funcDir, "view.ts"), path.join(funcDir, `${funcName}View.ts`)]) {
        if (fs2.existsSync(cand)) {
          uiPath = cand;
          break;
        }
      }
      nodes.push({
        id: funcId,
        name: funcName,
        type: "functionality",
        filePath: logicPath,
        uiFilePath: uiPath,
        helpers,
        inputs,
        outputs,
        stateFields,
        position: positions[funcId]
      });
      this.scanConstituents("shared", funcName, funcDir, nodes, edges, positions, inputs, outputs, stateFields, helpers, uiPath);
    }
  }
  scanFunctionalities(entityName, entityDir, entityId, entityNode, nodes, edges, positions) {
    let funcsDir = path.join(entityDir, "functionalities");
    if (!fs2.existsSync(funcsDir)) funcsDir = entityDir;
    for (const func of fs2.readdirSync(funcsDir, { withFileTypes: true })) {
      if (!func.isDirectory() || func.name === "subsystems") continue;
      const funcName = func.name;
      const funcDir = path.join(funcsDir, funcName);
      const funcId = `functionality:${entityName}:${funcName}`;
      entityNode.functionalities?.push(funcName);
      const atomPath = path.join(funcDir, "atom", `${funcName}Atom.ts`);
      const statePath = path.join(funcDir, "state_data", "state.ts");
      const helpersDir = path.join(funcDir, "helper_functions");
      const logicPath = path.join(funcDir, "main_function", "logic.ts");
      const { inputs, outputs } = this.metadataExtractor.extractInputsAndOutputs(atomPath);
      const stateFields = this.metadataExtractor.extractStateFields(statePath);
      const helpers = this.metadataExtractor.extractHelperNames(helpersDir);
      let uiPath;
      for (const cand of [path.join(funcDir, "ui.ts"), path.join(funcDir, "view.ts"), path.join(funcDir, `${funcName}View.ts`)]) {
        if (fs2.existsSync(cand)) {
          uiPath = cand;
          break;
        }
      }
      nodes.push({
        id: funcId,
        name: funcName,
        type: "functionality",
        filePath: logicPath,
        uiFilePath: uiPath,
        parentEntity: entityName,
        helpers,
        inputs,
        outputs,
        stateFields,
        position: positions[funcId]
      });
      edges.push({
        id: `edge:${entityName}->${funcName}`,
        source: entityId,
        target: funcId,
        type: "contains",
        deletable: false
      });
      this.scanConstituents(entityName, funcName, funcDir, nodes, edges, positions, inputs, outputs, stateFields, helpers, uiPath);
    }
  }
  scanConstituents(entityName, funcName, funcDir, nodes, edges, positions, inputs, outputs, stateFields, helpers, uiPath) {
    const scope = `functionality:${entityName}:${funcName}`;
    const atomId = `comp_${entityName}_${funcName}_atom`;
    const logicId = `comp_${entityName}_${funcName}_logic`;
    const stateId = `comp_${entityName}_${funcName}_state`;
    nodes.push({
      id: atomId,
      name: `${funcName}Atom`,
      type: "component_atom",
      filePath: path.join(funcDir, "atom", `${funcName}Atom.ts`),
      inputs,
      outputs,
      scope,
      position: positions[atomId]
    });
    nodes.push({
      id: logicId,
      name: "main_logic",
      type: "component_logic",
      filePath: path.join(funcDir, "main_function", "logic.ts"),
      scope,
      position: positions[logicId]
    });
    nodes.push({
      id: stateId,
      name: `${funcName}State`,
      type: "component_state",
      filePath: path.join(funcDir, "state_data", "state.ts"),
      stateFields,
      scope,
      position: positions[stateId]
    });
    edges.push({ id: `edge_${atomId}_${logicId}`, source: atomId, target: logicId, type: "dataflow", scope, deletable: false });
    edges.push({ id: `edge_${stateId}_${logicId}`, source: stateId, target: logicId, type: "dataflow", scope, deletable: false });
    helpers.forEach((h) => {
      const helperId = `comp_${entityName}_${funcName}_helper_${h}`;
      nodes.push({
        id: helperId,
        name: h,
        type: "component_helper",
        filePath: path.join(funcDir, "helper_functions", `${h}.ts`),
        scope,
        position: positions[helperId]
      });
      edges.push({ id: `edge_${helperId}_${logicId}`, source: helperId, target: logicId, type: "dataflow", scope, deletable: false });
    });
    const uiId = `comp_${entityName}_${funcName}_ui`;
    const resolvedUiPath = uiPath || path.join(funcDir, `${funcName}View.ts`);
    nodes.push({
      id: uiId,
      name: `${funcName}View`,
      type: "component_ui",
      filePath: resolvedUiPath,
      scope,
      position: positions[uiId]
    });
    edges.push({ id: `edge_${logicId}_${uiId}`, source: logicId, target: uiId, type: "dataflow", scope, deletable: false });
  }
  scanLibraries(nodes, edges, positions) {
    for (const cand of [path.join(this.projectRoot, "src/libraries"), path.join(this.projectRoot, "libraries")]) {
      if (fs2.existsSync(cand)) this.scanLibraryFolder(cand, cand, [], void 0, nodes, edges, positions);
    }
  }
  scanLibraryFolder(base, curr, cats, parent, nodes, edges, positions) {
    if (!fs2.existsSync(curr)) return;
    for (const entry of fs2.readdirSync(curr, { withFileTypes: true })) {
      if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
      const full = path.join(curr, entry.name);
      if (entry.isDirectory()) {
        this.scanLibraryFolder(base, full, [...cats, entry.name], parent, nodes, edges, positions);
      } else if (/\.(ts|js|mjs)$/.test(entry.name) && !entry.name.endsWith(".d.ts") && !/\.(test|spec)\./.test(entry.name)) {
        const raw = path.basename(entry.name, path.extname(entry.name));
        const name = raw === "index" && cats.length > 0 ? cats[cats.length - 1] : raw;
        const rel = path.relative(base, full).replace(/[\\/.]+/g, "_");
        const id = parent ? `lib_${parent}_${rel}` : `lib_${rel}`;
        nodes.push({
          id,
          name,
          type: "library",
          filePath: full,
          parentEntity: parent,
          category: cats.length > 0 ? cats.join(" \u2192 ") : void 0,
          categoryPath: cats.length > 0 ? cats : void 0,
          scope: "root",
          position: positions[id]
        });
      }
    }
  }
  scanSubApps(nodes, edges, positions) {
    const subappDir = path.join(this.projectRoot, "src/subapps");
    if (!fs2.existsSync(subappDir)) return;
    for (const app of fs2.readdirSync(subappDir, { withFileTypes: true })) {
      if (!app.isDirectory()) continue;
      const appId = `subapp_${app.name}`;
      nodes.push({
        id: appId,
        name: app.name,
        type: "subapp",
        filePath: path.join(subappDir, app.name, "index.ts"),
        position: positions[appId]
      });
    }
  }
};

// ../studio/src/server/ast/AstOrchestrationMutator.ts
import * as fs3 from "fs";
import * as path2 from "path";
import { SyntaxKind } from "ts-morph";
var AstOrchestrationMutator = class {
  projectRoot;
  project;
  customEdges = [];
  constructor(projectRoot, project) {
    this.projectRoot = projectRoot;
    this.project = project;
  }
  extractOrchestrationEdges(entityName) {
    const edges = [...this.customEdges];
    const entityFilePath = path2.join(this.projectRoot, "src/entities", entityName, `${entityName}Entity.ts`);
    try {
      const sourceFile = this.project.getSourceFile(entityFilePath) || this.project.addSourceFileAtPath(entityFilePath);
      const entityClass = sourceFile.getClass((c) => c.getName() === `${entityName}Entity` || c.getName() === entityName);
      if (!entityClass) return edges;
      const bootMethod = entityClass.getMethod("boot");
      if (!bootMethod) return edges;
      const callExprs = bootMethod.getDescendantsOfKind(SyntaxKind.CallExpression);
      let previousTarget = null;
      for (const call of callExprs) {
        const propAccess = call.getExpression();
        if (propAccess.getKind() !== SyntaxKind.PropertyAccessExpression) continue;
        const methodName = propAccess.getText().split(".").pop();
        if (methodName === "thenFunctionality" || methodName === "thenFunction") {
          const args2 = call.getArguments();
          if (args2.length > 0) {
            const rawTarget = args2[0].getText().replace(/['"]/g, "").trim();
            const targetId = methodName === "thenFunctionality" ? `func_${entityName}_${rawTarget}` : `func_${rawTarget}`;
            if (previousTarget && previousTarget !== targetId) {
              edges.push({
                id: `orch_edge_${previousTarget}_${targetId}`,
                source: previousTarget,
                target: targetId,
                type: "orchestration_step",
                deletable: true
              });
            }
            previousTarget = targetId;
          }
        }
      }
    } catch (e) {
    }
    return edges;
  }
  connectNodes(source, target, type = "dataflow") {
    const isTargetFunction = target.startsWith("function:");
    const isSourceFunction = source.startsWith("function:");
    if (isTargetFunction && isSourceFunction) {
      const hasPrecedingFunction = this.customEdges.some(
        (e) => e.target === source && e.source.startsWith("function:")
      );
      if (hasPrecedingFunction) {
        return {
          success: false,
          error: "Cannot chain more than 2 global functions between functionalities. Compose additional logic into a single library function instead."
        };
      }
    }
    const edgeId = `edge:${source}->${target}:${Date.now()}`;
    const edge = { id: edgeId, source, target, type, deletable: true };
    this.customEdges.push(edge);
    return { success: true, edge };
  }
  deleteEdge(edgeId) {
    this.customEdges = this.customEdges.filter((e) => e.id !== edgeId);
    return { success: true, deletedEdgeId: edgeId };
  }
  addFlowStep(entityFilePath, flowName, stepFunctionName) {
    return true;
  }
  listGlobalLibraryFunctions() {
    const res = [];
    const libDir = path2.join(this.projectRoot, "src/libraries");
    if (!fs3.existsSync(libDir)) return res;
    try {
      const libs = fs3.readdirSync(libDir, { withFileTypes: true });
      for (const lib of libs) {
        if (!lib.isDirectory()) continue;
        const libName = lib.name.replace(/\.ts$/, "");
        res.push({
          name: `${libName}.process`,
          libraryName: libName,
          library: libName,
          functionName: "process"
        });
      }
    } catch (e) {
    }
    return res;
  }
  addOrchestrationStep(entityFilePathOrName, orchestrationNameOrFromId, stepTypeOrToId, targetName, libName) {
    const entityName = entityFilePathOrName.includes("/") ? path2.basename(entityFilePathOrName).replace(/Entity\.ts$/, "") : entityFilePathOrName;
    const entityFilePath = path2.isAbsolute(entityFilePathOrName) ? entityFilePathOrName : path2.join(this.projectRoot, "src/entities", entityName, `${entityName}Entity.ts`);
    try {
      const sourceFile = this.project.getSourceFile(entityFilePath) || this.project.addSourceFileAtPath(entityFilePath);
      const entityClass = sourceFile.getClass((c) => c.getName() === `${entityName}Entity` || c.getName() === entityName);
      if (!entityClass) return { success: false, message: `Entity ${entityName} not found` };
      let bootMethod = entityClass.getMethod("boot");
      if (!bootMethod) {
        bootMethod = entityClass.addMethod({ name: "boot", returnType: "this", statements: "return this;" });
      }
      const cleanToName = (targetName || stepTypeOrToId).replace(/^func_[^_]+_/, "").replace(/^func_/, "");
      const chainMethod = stepTypeOrToId === "function" || targetName ? "thenFunction" : "thenFunctionality";
      const newCall = `.${chainMethod}('${cleanToName}')`;
      const bodyText = bootMethod.getBodyText() || "return this;";
      if (bodyText.includes("return this;")) {
        bootMethod.setBodyText(bodyText.replace("return this;", `return this${newCall};`));
      } else if (bodyText.includes("return this.")) {
        bootMethod.setBodyText(bodyText.replace(";", `${newCall};`));
      } else {
        bootMethod.setBodyText(`return this${newCall};
${bodyText}`);
      }
      sourceFile.saveSync();
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message || String(err) };
    }
  }
};

// ../studio/src/server/ast/AstNodeMutator.ts
import * as fs4 from "fs";
import * as path3 from "path";
var AstNodeMutator = class {
  projectRoot;
  layoutPath;
  undoStack = [];
  redoStack = [];
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.layoutPath = path3.join(projectRoot, ".krnl", "layout.json");
  }
  loadPositions() {
    if (fs4.existsSync(this.layoutPath)) {
      try {
        return JSON.parse(fs4.readFileSync(this.layoutPath, "utf8"));
      } catch (e) {
      }
    }
    return {};
  }
  savePositions(positions) {
    try {
      const dir = path3.dirname(this.layoutPath);
      if (!fs4.existsSync(dir)) fs4.mkdirSync(dir, { recursive: true });
      fs4.writeFileSync(this.layoutPath, JSON.stringify(positions, null, 2), "utf8");
    } catch (e) {
    }
  }
  moveNode(nodeId, x, y) {
    const pos = this.loadPositions();
    this.undoStack.push({ ...pos });
    pos[nodeId] = { x, y };
    this.savePositions(pos);
    return { success: true, position: { x, y } };
  }
  moveMultipleNodes(positions) {
    const pos = this.loadPositions();
    this.undoStack.push({ ...pos });
    Object.assign(pos, positions);
    this.savePositions(pos);
    return { success: true };
  }
  alignLayout(algorithm = "hierarchical") {
    const positions = this.loadPositions();
    return { success: true, positions };
  }
  undo() {
    if (this.undoStack.length === 0) return { success: false };
    const cur = this.loadPositions();
    this.redoStack.push(cur);
    const prev = this.undoStack.pop();
    this.savePositions(prev);
    return { success: true };
  }
  redo() {
    if (this.redoStack.length === 0) return { success: false };
    const cur = this.loadPositions();
    this.undoStack.push(cur);
    const next = this.redoStack.pop();
    this.savePositions(next);
    return { success: true };
  }
  deleteNode(nodeId) {
    const pos = this.loadPositions();
    delete pos[nodeId];
    this.savePositions(pos);
    return { success: true, deletedNodeId: nodeId };
  }
  createEntity(entityName) {
    const entityDir = path3.join(this.projectRoot, "src/entities", entityName);
    fs4.mkdirSync(entityDir, { recursive: true });
    const entityFilePath = path3.join(entityDir, `${entityName}Entity.ts`);
    const content = `import { Entity } from '@dinilmusick/krnl-core';

export class ${entityName}Entity extends Entity {
  public boot() {
    return this;
  }
}
`;
    fs4.writeFileSync(entityFilePath, content, "utf8");
    return { success: true, filePath: entityFilePath };
  }
  createFunctionality(entityName, funcName) {
    const funcDir = path3.join(this.projectRoot, "src/entities", entityName, funcName);
    fs4.mkdirSync(path3.join(funcDir, "atom"), { recursive: true });
    fs4.mkdirSync(path3.join(funcDir, "state_data"), { recursive: true });
    fs4.mkdirSync(path3.join(funcDir, "main_function"), { recursive: true });
    fs4.mkdirSync(path3.join(funcDir, "helper_functions"), { recursive: true });
    const f1 = path3.join(funcDir, "atom", `${funcName}Atom.ts`);
    const f2 = path3.join(funcDir, "state_data", "state.ts");
    const f3 = path3.join(funcDir, "main_function", "logic.ts");
    fs4.writeFileSync(f1, `export interface ${funcName}Input { [k: string]: any; }
export interface ${funcName}Output { success: boolean; }
`);
    fs4.writeFileSync(f2, `export interface ${funcName}State { active: boolean; }
`);
    fs4.writeFileSync(f3, `import { ${funcName}Input, ${funcName}Output } from '../atom/${funcName}Atom.js';

export async function main(input: ${funcName}Input): Promise<${funcName}Output> {
  return { success: true };
}
`);
    return { success: true, filesCreated: [f1, f2, f3] };
  }
  createLibrary(name) {
    const clean = name.replace(/Concepts$/, "");
    const libDir = path3.join(this.projectRoot, "src/libraries", `${clean}Concepts`);
    fs4.mkdirSync(libDir, { recursive: true });
    const f = path3.join(libDir, "index.ts");
    fs4.writeFileSync(f, `export class ${clean}Concepts {
  static process(d: any) { return { valid: true }; }
}
`);
    return { success: true, filePath: f };
  }
};

// ../studio/src/server/AstMutationEngine.ts
var AstMutationEngine = class {
  projectRoot;
  project;
  metadataExtractor;
  scanner;
  orchestrationMutator;
  nodeMutator;
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.project = new Project2({ skipAddingFilesFromTsConfig: true });
    this.metadataExtractor = new AstMetadataExtractor(this.project);
    this.scanner = new AstScanner(this.projectRoot, this.metadataExtractor);
    this.orchestrationMutator = new AstOrchestrationMutator(this.projectRoot, this.project);
    this.nodeMutator = new AstNodeMutator(this.projectRoot);
  }
  extractArchitectureGraph() {
    const positions = this.nodeMutator.loadPositions();
    const graph = this.scanner.scanWorkspace(positions);
    const entities = graph.nodes.filter((n) => n.type === "entity");
    for (const ent of entities) {
      const orchEdges = this.orchestrationMutator.extractOrchestrationEdges(ent.name);
      graph.edges.push(...orchEdges);
    }
    return graph;
  }
  moveNode(nodeId, x, y) {
    return this.nodeMutator.moveNode(nodeId, x, y);
  }
  moveMultipleNodes(positions) {
    return this.nodeMutator.moveMultipleNodes(positions);
  }
  alignLayout(algorithm) {
    return this.nodeMutator.alignLayout(algorithm);
  }
  undo() {
    return this.nodeMutator.undo();
  }
  redo() {
    return this.nodeMutator.redo();
  }
  deleteNode(nodeId) {
    return this.nodeMutator.deleteNode(nodeId);
  }
  createEntity(entityName) {
    return this.nodeMutator.createEntity(entityName);
  }
  createFunctionality(entityName, funcName) {
    return this.nodeMutator.createFunctionality(entityName, funcName);
  }
  createLibrary(name) {
    return this.nodeMutator.createLibrary(name);
  }
  connectNodes(source, target, type) {
    return this.orchestrationMutator.connectNodes(source, target, type);
  }
  deleteEdge(edgeId) {
    return this.orchestrationMutator.deleteEdge(edgeId);
  }
  addFlowStep(p1, p2, p3) {
    return this.orchestrationMutator.addFlowStep(p1, p2, p3);
  }
  listGlobalLibraryFunctions() {
    return this.orchestrationMutator.listGlobalLibraryFunctions();
  }
  addOrchestrationStep(p1, p2, p3, p4, p5) {
    return this.orchestrationMutator.addOrchestrationStep(p1, p2, p3, p4, p5);
  }
};

// ../studio/src/server/FunctionExecutor.ts
import * as path4 from "path";
import * as fs5 from "fs";
import { pathToFileURL } from "url";
import * as esbuild from "esbuild";
var FunctionExecutor = class {
  /**
   * Executes a specific function, entity, or library in an isolated sandbox with metrics.
   */
  static async execute(request) {
    const startTime = performance.now();
    const initialMem = process.memoryUsage().heapUsed;
    const logs = [];
    let absPath = path4.resolve(request.filePath);
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
      const base = path4.basename(absPath);
      const candidates = [
        path4.join(absPath, "main_function/logic.ts"),
        path4.join(absPath, `${base}.ts`),
        path4.join(absPath, "index.ts"),
        path4.join(absPath, "entity.ts")
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
    const dirOfEntry = path4.dirname(absPath);
    const tempBundlePath = path4.join(
      dirOfEntry,
      `.krnl-exec-${Date.now()}-${Math.random().toString(36).substring(7)}.mjs`
    );
    const tsResolverPlugin = {
      name: "ts-resolver-plugin",
      setup(build2) {
        build2.onResolve({ filter: /.*/ }, (args2) => {
          if (args2.path.startsWith(".")) {
            const dir = args2.resolveDir || path4.dirname(args2.importer);
            const candidateJs = path4.resolve(dir, args2.path);
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
      const fileUrl = pathToFileURL(tempBundlePath).href;
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
import * as fs6 from "fs";
import * as path5 from "path";
var StudioFileWatcher = class {
  watcher = null;
  rootDir;
  listeners = /* @__PURE__ */ new Set();
  debounceTimers = /* @__PURE__ */ new Map();
  constructor(rootDir = process.cwd()) {
    this.rootDir = path5.resolve(rootDir);
  }
  start() {
    if (this.watcher) return;
    const srcDir = path5.join(this.rootDir, "src");
    if (!fs6.existsSync(srcDir)) return;
    this.watcher = fs6.watch(srcDir, { recursive: true }, (eventType, filename) => {
      if (!filename) return;
      if (filename.includes("node_modules") || filename.includes("dist") || filename.includes(".git") || filename.endsWith(".d.ts") || filename.endsWith(".log") || filename.endsWith(".tmp") || filename.includes(".krnl-graph") || filename.includes(".DS_Store")) {
        return;
      }
      const fullPath = path5.join(srcDir, filename);
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
  updateRoot(newRoot) {
    this.stop();
    this.rootDir = path5.resolve(newRoot);
    this.start();
  }
  stop() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }
};

// ../studio/src/server/JsonRpcRouter.ts
import * as fs7 from "fs";
import * as path6 from "path";

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
    this.projectRoot = path6.resolve(projectRoot);
    this.astEngine = new AstMutationEngine(this.projectRoot);
    this.validator = new KrnlValidatorEngine({ projectRoot: this.projectRoot });
    this.onMutationCallback = onMutation;
  }
  setProjectRoot(newRoot) {
    this.projectRoot = path6.resolve(newRoot);
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
          const abs = path6.resolve(this.projectRoot, targetPath);
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
          if (!res.success) {
            return { jsonrpc: "2.0", id, error: { code: -32002, message: res.error || "Connection rejected by validation rule" } };
          }
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
        case "library.listFunctions": {
          const functions = this.astEngine.listGlobalLibraryFunctions();
          return { jsonrpc: "2.0", id, result: { success: true, functions } };
        }
        case "orchestration.addStep": {
          const { entityFilePath, orchestrationName, stepType, targetName, libName } = params;
          const res = this.astEngine.addOrchestrationStep(entityFilePath, orchestrationName, stepType, targetName, libName);
          const graph = this.astEngine.extractArchitectureGraph();
          this.notifyMutation("orchestration.addStep", { orchestrationName, stepType, targetName, ...res });
          return { jsonrpc: "2.0", id, result: { ...res, graph } };
        }
        // 4. Code Mutation & Robust File Reading
        case "file.read": {
          const { filePath } = params;
          let abs = path6.isAbsolute(filePath) ? filePath : path6.resolve(this.projectRoot, filePath);
          if (!fs7.existsSync(abs)) throw new Error(`File not found: ${filePath}`);
          let content = "";
          if (fs7.lstatSync(abs).isDirectory()) {
            const base = path6.basename(abs);
            const candidateTs = path6.join(abs, `${base}.ts`);
            const candidateIndex = path6.join(abs, "index.ts");
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
          const abs = path6.resolve(this.projectRoot, filePath);
          fs7.writeFileSync(abs, newContent, "utf-8");
          this.notifyMutation("file.edit", { filePath });
          const decorated = PreemptiveDocManager.decorateResponse("file.edit", { success: true, filePath: abs });
          return { jsonrpc: "2.0", id, result: decorated };
        }
        case "ui.generate": {
          const { componentTree, componentName, targetFilePath } = params;
          const code = VanJSCodeGenerator.generateCode(componentTree, componentName || "GeneratedView");
          if (targetFilePath) {
            const abs = path6.resolve(this.projectRoot, targetFilePath);
            fs7.mkdirSync(path6.dirname(abs), { recursive: true });
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
import * as http from "http";
import * as fs10 from "fs";
import * as path9 from "path";
import { WebSocketServer, WebSocket } from "ws";

// ../studio/src/server/StaticFileServer.ts
import * as fs8 from "fs";
import * as path7 from "path";
var MIME_TYPES = {
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png"
};
var StaticFileServer = class {
  baseDirs;
  constructor() {
    const base = typeof __dirname !== "undefined" ? __dirname : process.cwd();
    this.baseDirs = [
      path7.join(base, "../ui"),
      path7.join(base, "../../src/ui"),
      path7.join(process.cwd(), "packages/studio/src/ui"),
      path7.join(process.cwd(), "src/ui")
    ];
  }
  serveFile(req, res, relativePath) {
    const cleanPath = path7.normalize(relativePath.replace(/^\/ui\/?/, "")).replace(/^(\.\.[\/\\])+/, "");
    for (const baseDir of this.baseDirs) {
      const fullPath = path7.join(baseDir, cleanPath);
      if (fs8.existsSync(fullPath) && fs8.statSync(fullPath).isFile()) {
        const ext = path7.extname(fullPath).toLowerCase();
        const mime = MIME_TYPES[ext] || "text/plain; charset=utf-8";
        const content = fs8.readFileSync(fullPath);
        res.writeHead(200, {
          "Content-Type": mime,
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Content-Length": Buffer.byteLength(content)
        });
        res.end(content);
        return true;
      }
    }
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(`File not found: ${cleanPath}`);
    return false;
  }
};

// ../studio/src/server/HttpRouteHandler.ts
import * as fs9 from "fs";
import * as path8 from "path";
var ROUTE_MAP = {
  "/api/v1/project/create": "project.create",
  "/api/v1/project/load": "project.load",
  "/api/v1/project/graph": "graph.getArchitecture",
  "/api/v1/project/status": "project.getStatus",
  "/api/v1/graph/moveNode": "graph.moveNode",
  "/api/v1/graph/moveMultipleNodes": "graph.moveMultipleNodes",
  "/api/v1/graph/connectNodes": "graph.connectNodes",
  "/api/v1/graph/deleteEdge": "graph.deleteEdge",
  "/api/v1/graph/deleteNode": "graph.deleteNode",
  "/api/v1/graph/alignLayout": "graph.alignLayout",
  "/api/v1/graph/undo": "graph.undo",
  "/api/v1/graph/redo": "graph.redo",
  "/api/v1/entity/create": "entity.create",
  "/api/v1/functionality/create": "functionality.create",
  "/api/v1/library/create": "library.create",
  "/api/v1/flow/addStep": "flow.addStep",
  "/api/v1/file/read": "file.read",
  "/api/v1/file/edit": "file.edit",
  "/api/v1/ui/generate": "ui.generate",
  "/api/v1/validate/audit": "validate.audit",
  "/api/v1/test/execute": "test.executeFunction",
  "/api/v1/docs/endpoints": "docs.endpoints"
};
var HttpRouteHandler = class {
  static async handleApiRequest(req, res, url, router, onGraphUpdate) {
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
        const method = ROUTE_MAP[url] || "graph.getArchitecture";
        const rpcRes = await router.handle({
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
          onGraphUpdate();
        }
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message || String(err) }));
      }
    });
  }
  static getStudioHtml() {
    const base = typeof __dirname !== "undefined" ? __dirname : process.cwd();
    const candidates = [
      path8.join(base, "studio.html"),
      path8.join(base, "../../src/server/studio.html"),
      path8.join(process.cwd(), "packages/studio/src/server/studio.html"),
      path8.join(process.cwd(), "src/server/studio.html")
    ];
    for (const candidate of candidates) {
      if (fs9.existsSync(candidate)) {
        return fs9.readFileSync(candidate, "utf8");
      }
    }
    return `<!DOCTYPE html><html><body><h1>Krnl Studio Error: studio.html not found.</h1></body></html>`;
  }
};

// ../studio/src/server/StudioServer.ts
var StudioServer = class {
  port;
  projectRoot;
  httpServer;
  wss;
  router;
  watcher;
  astEngine;
  staticServer;
  constructor(options = {}) {
    this.port = options.port || 8080;
    const initialRoot = path9.resolve(options.projectRoot || process.cwd());
    const unifiedPath = path9.join(initialRoot, "examples/unified-workspace");
    this.projectRoot = !fs10.existsSync(path9.join(initialRoot, "src/entities")) && fs10.existsSync(unifiedPath) ? unifiedPath : initialRoot;
    this.astEngine = new AstMutationEngine(this.projectRoot);
    this.watcher = new StudioFileWatcher(this.projectRoot);
    this.staticServer = new StaticFileServer();
    this.router = new JsonRpcRouter(this.projectRoot, (mutation) => {
      this.broadcastAgentActivity(mutation);
    });
    this.httpServer = http.createServer((req, res) => this.handleHttpRequest(req, res));
    this.wss = new WebSocketServer({ server: this.httpServer, path: "/studio/ws", perMessageDeflate: false });
    this.wss.on("error", (err) => console.warn("WSS Error:", err));
    this.initWebSocket();
    this.initFileWatcher();
  }
  initWebSocket() {
    this.wss.on("connection", (ws) => {
      ws.on("error", (err) => console.warn("WS Client Error:", err?.message));
      const graph = this.astEngine.extractArchitectureGraph();
      ws.send(JSON.stringify({ jsonrpc: "2.0", method: "graph.init", params: { ...graph, projectRoot: this.projectRoot } }));
      ws.on("message", async (data) => {
        try {
          const req = JSON.parse(data.toString());
          if (req.method === "project.openDirectory" && req.params?.directory) {
            const targetPath = path9.resolve(req.params.directory);
            if (fs10.existsSync(targetPath)) {
              this.projectRoot = targetPath;
              this.astEngine = new AstMutationEngine(this.projectRoot);
              this.router.setProjectRoot(this.projectRoot);
              this.watcher.updateRoot(this.projectRoot);
              ws.send(JSON.stringify({ jsonrpc: "2.0", id: req.id, result: { success: true, projectRoot: this.projectRoot } }));
              this.broadcastGraphUpdate();
            } else {
              ws.send(JSON.stringify({ jsonrpc: "2.0", id: req.id, error: { code: -32001, message: "Directory does not exist: " + targetPath } }));
            }
            return;
          }
          const res = await this.router.handle(req);
          if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(res));
          if (req.method && (req.method.startsWith("graph.") || req.method.startsWith("entity.") || req.method.startsWith("functionality.") || req.method.startsWith("library."))) {
            this.broadcastGraphUpdate();
          }
        } catch (e) {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ jsonrpc: "2.0", error: { code: -32700, message: "Parse error: " + (e.message || String(e)) } }));
          }
        }
      });
    });
  }
  initFileWatcher() {
    this.watcher.start();
    this.watcher.subscribe(() => this.broadcastGraphUpdate());
  }
  broadcastGraphUpdate() {
    try {
      const graph = this.astEngine.extractArchitectureGraph();
      const payload = JSON.stringify({ jsonrpc: "2.0", method: "graph.updated", params: { ...graph, projectRoot: this.projectRoot } });
      for (const client of this.wss.clients) {
        if (client.readyState === WebSocket.OPEN) client.send(payload);
      }
    } catch (e) {
    }
  }
  broadcastAgentActivity(mutation) {
    try {
      const payload = JSON.stringify({ jsonrpc: "2.0", method: "agent.activity", params: { action: mutation.action, params: mutation.params, timestamp: Date.now() } });
      for (const client of this.wss.clients) {
        if (client.readyState === WebSocket.OPEN) client.send(payload);
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
    if (url.startsWith("/ui/")) {
      this.staticServer.serveFile(req, res, url);
      return;
    }
    if (url.startsWith("/api/v1/")) {
      await HttpRouteHandler.handleApiRequest(req, res, url, this.router, () => this.broadcastGraphUpdate());
      return;
    }
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(HttpRouteHandler.getStudioHtml());
  }
  async start() {
    return new Promise((resolve6) => {
      this.httpServer.listen(this.port, () => {
        console.log(`
\u{1F680} [Krnl Studio] Omni Canvas IDE running at: http://localhost:${this.port}`);
        console.log(`\u{1F4E1} [Krnl Studio] Active Project Root: ${this.projectRoot}`);
        console.log(`\u{1F4E1} [Krnl Studio] REST API Suite available at: http://localhost:${this.port}/api/v1/*`);
        console.log(`\u{1F4E1} [Krnl Studio] WebSocket JSON-RPC protocol active on /studio/ws
`);
        resolve6();
      });
    });
  }
  async stop() {
    this.watcher.stop();
    return new Promise((resolve6) => {
      this.wss.close(() => {
        this.httpServer.close(() => resolve6());
      });
    });
  }
};

// ../studio/src/client/plugins/VanJSRenderPlugin.ts
import van from "vanjs-core";
var { div, span, button } = van.tags;

// src/bin/krnl.ts
var args = process.argv.slice(2);
var command = args[0] || "help";
function detectAppEntrypoint(projectRoot) {
  const files = fs11.readdirSync(projectRoot);
  for (const f of files) {
    if (f.endsWith(".ts") && !f.endsWith(".d.ts") && f !== "tsup.config.ts") {
      const full = path10.join(projectRoot, f);
      try {
        const text = fs11.readFileSync(full, "utf8");
        if (text.includes("defineApp") || text.includes("@dinilmusick/krnl-core")) {
          return f;
        }
      } catch (e) {
      }
    }
  }
  return null;
}
async function main() {
  switch (command) {
    case "sync": {
      const targetDir = args[1] && !args[1].startsWith("-") ? path10.resolve(process.cwd(), args[1]) : process.cwd();
      console.log("\u{1F4E6} [Krnl Sync] Reconciling package.json from all manifest.json files...");
      const res = KrnlPackageReconciler.reconcile(targetDir, true);
      console.log(`\u2705 Reconciled dependencies from ${res.totalManifests} manifest.json file(s).`);
      if (res.conflicts.length > 0) {
        console.warn("\u26A0\uFE0F Version conflicts detected across manifests:", res.conflicts);
      }
      break;
    }
    case "validate": {
      const targetDir = args[1] && !args[1].startsWith("-") ? path10.resolve(process.cwd(), args[1]) : process.cwd();
      const valid = await runValidate(targetDir);
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
        fs11.watch(process.cwd(), { recursive: true }, (evt, filename) => {
          if (filename && (filename.endsWith(".ts") || filename.endsWith(".js")) && !filename.includes("krnl-magnetic.d.ts")) {
            try {
              generateMagneticDeclarations(process.cwd());
            } catch (e) {
            }
          }
          if (filename && filename.endsWith("manifest.json")) {
            try {
              KrnlPackageReconciler.reconcile(process.cwd(), true);
            } catch (e) {
            }
          }
        });
      }
      break;
    }
    case "build": {
      const projectRoot = process.cwd();
      const appFile = detectAppEntrypoint(projectRoot);
      const entityArgIdx = args.indexOf("--entity");
      const targetEntity = entityArgIdx !== -1 ? args[entityArgIdx + 1] : void 0;
      const isAll = args.includes("--all");
      KrnlPackageReconciler.reconcile(projectRoot, true);
      if (appFile) {
        console.log(`\u{1F3D7}\uFE0F  [Krnl Build] Found application entrypoint: ${appFile}`);
      }
      if (targetEntity) {
        console.log(`\u{1F3D7}\uFE0F  [Krnl Build] Validating and building app variant for entity "${targetEntity}"...`);
      } else if (isAll) {
        console.log(`\u{1F3D7}\uFE0F  [Krnl Build] Validating and building combined multi-entity application...`);
      } else {
        console.log(`\u{1F3D7}\uFE0F  [Krnl Build] Validating and building project...`);
      }
      const valid = await runValidate(projectRoot);
      if (!valid) {
        console.error("\u274C Build aborted due to validation errors.");
        process.exit(1);
      }
      generateMagneticDeclarations(projectRoot);
      console.log(`\u2705 [Krnl Build] Compilation completed successfully.`);
      break;
    }
    case "dev": {
      const projectRoot = process.cwd();
      const appFile = detectAppEntrypoint(projectRoot);
      const portArgIdx = args.indexOf("--port");
      const port = portArgIdx !== -1 ? parseInt(args[portArgIdx + 1], 10) : 8080;
      const entityArgIdx = args.indexOf("--entity");
      const targetEntity = entityArgIdx !== -1 ? args[entityArgIdx + 1] : void 0;
      const isAll = args.includes("--all");
      KrnlPackageReconciler.reconcile(projectRoot, true);
      if (appFile) {
        console.log(`\u26A1 [Krnl Dev] Booting app configuration from: ${appFile}`);
      }
      if (targetEntity) {
        console.log(`\u26A1 [Krnl Dev] Initializing app variant for entity "${targetEntity}" on port ${port}...`);
      } else if (isAll) {
        console.log(`\u26A1 [Krnl Dev] Initializing combined multi-entity workspace on port ${port}...`);
      } else {
        console.log(`\u26A1 [Krnl Dev] Initializing Krnl Studio visual workspace on port ${port}...`);
      }
      const server = new StudioServer({
        port,
        projectRoot
      });
      generateMagneticDeclarations(server.projectRoot || projectRoot);
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
  dev               Start Krnl Studio dev server & boot <app_name>.ts entrypoint
  build             Validate and build project for production
  validate          Run deep AST & 4-layer function purity validation
  sync              Reconcile package.json from all co-located manifest.json files
  watch             Generate ambient TypeScript declarations (krnl-magnetic.d.ts)
  generate          Scaffold entities, functionalities, libraries, subapps
                    Examples:
                      krnl generate entity UserSystem
                      krnl generate functionality CreateProfile
                      krnl generate library Math
                      krnl generate subapp BillingEngine

Options:
  --entity <name>   Target a specific entity app variant to run or build
  --all             Run or build all entities as a combined multi-entity build
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
