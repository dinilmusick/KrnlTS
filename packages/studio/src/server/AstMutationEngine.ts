import * as fs from 'fs';
import * as path from 'path';
import { Project, SyntaxKind, SourceFile, Node, Block } from 'ts-morph';

export interface ArchitectureNode {
  id: string;
  type: 'entity' | 'functionality' | 'library' | 'subapp' | 'flow';
  name: string;
  parentEntity?: string;
  filePath: string;
  position?: { x: number; y: number };
  inputs?: Array<{ name: string; type: string }>;
  outputs?: Array<{ name: string; type: string }>;
  stateFields?: Array<{ name: string; type: string }>;
  helpers?: Array<{ name: string; filePath: string }>;
  uiSpec?: boolean;
}

export interface ArchitectureEdge {
  id: string;
  source: string;
  target: string;
  type: 'contains' | 'dataflow' | 'flow_step' | 'uses_library';
  deletable?: boolean;
}

export interface ArchitectureGraph {
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
}

export class AstMutationEngine {
  private projectRoot: string;
  private project: Project;
  private customEdges: ArchitectureEdge[] = [];
  private deletedEdges: Set<string> = new Set();
  private nodePositions: Map<string, { x: number; y: number }> = new Map();
  private undoStack: ArchitectureGraph[] = [];
  private redoStack: ArchitectureGraph[] = [];

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = path.resolve(projectRoot);
    const tsConfigPath = path.join(this.projectRoot, 'tsconfig.json');
    if (fs.existsSync(tsConfigPath)) {
      this.project = new Project({ tsConfigFilePath: tsConfigPath, skipAddingFilesFromTsConfig: true });
    } else {
      this.project = new Project({ compilerOptions: { target: 99 /* ESNext */ } });
    }
    this.loadPersistedGraphState();
  }

  private getGraphStateFilePath(): string {
    return path.join(this.projectRoot, '.krnl-graph.json');
  }

  private loadPersistedGraphState() {
    try {
      const p = this.getGraphStateFilePath();
      if (fs.existsSync(p)) {
        const raw = JSON.parse(fs.readFileSync(p, 'utf-8'));
        if (raw.positions) {
          for (const [k, v] of Object.entries(raw.positions)) {
            this.nodePositions.set(k, v as { x: number; y: number });
          }
        }
        if (Array.isArray(raw.customEdges)) {
          this.customEdges = raw.customEdges;
        }
        if (Array.isArray(raw.deletedEdges)) {
          this.deletedEdges = new Set(raw.deletedEdges);
        }
      }
    } catch (e) {}
  }

  private persistGraphState() {
    try {
      const p = this.getGraphStateFilePath();
      const posObj: Record<string, { x: number; y: number }> = {};
      this.nodePositions.forEach((v, k) => { posObj[k] = v; });
      fs.writeFileSync(p, JSON.stringify({
        positions: posObj,
        customEdges: this.customEdges,
        deletedEdges: Array.from(this.deletedEdges)
      }, null, 2), 'utf-8');
    } catch (e) {}
  }

  public extractArchitectureGraph(): ArchitectureGraph {
    const nodes: ArchitectureNode[] = [];
    let edges: ArchitectureEdge[] = [];

    const possibleEntityDirs = [
      path.join(this.projectRoot, 'src', 'entities'),
      path.join(this.projectRoot, 'entities')
    ];

    for (const entitiesDir of possibleEntityDirs) {
      if (fs.existsSync(entitiesDir)) {
        this.scanEntitiesRecursive(entitiesDir, nodes, edges);
      }
    }

    const possibleLibDirs = [
      path.join(this.projectRoot, 'src', 'libraries'),
      path.join(this.projectRoot, 'libraries')
    ];

    for (const libDir of possibleLibDirs) {
      if (fs.existsSync(libDir)) {
        const libFiles = fs.readdirSync(libDir, { withFileTypes: true });
        for (const file of libFiles) {
          if (file.isFile() && (file.name.endsWith('.ts') || file.name.endsWith('.js'))) {
            const baseName = file.name.replace(/\.(ts|js)$/, '');
            const libPath = path.join(libDir, file.name);
            nodes.push({
              id: `library:${baseName}`,
              type: 'library',
              name: baseName,
              filePath: libPath
            });
          }
        }
      }
    }

    const possibleSubappDirs = [
      path.join(this.projectRoot, 'src', 'subapps'),
      path.join(this.projectRoot, 'subapps')
    ];

    for (const subappDir of possibleSubappDirs) {
      if (fs.existsSync(subappDir)) {
        const subapps = fs.readdirSync(subappDir, { withFileTypes: true });
        for (const sa of subapps) {
          if (sa.isDirectory()) {
            const saName = sa.name;
            const saPath = path.join(subappDir, saName);
            nodes.push({
              id: `subapp:${saName}`,
              type: 'subapp',
              name: saName,
              filePath: saPath
            });
          }
        }
      }
    }

    // Attach stored positions if available
    for (const node of nodes) {
      if (this.nodePositions.has(node.id)) {
        node.position = this.nodePositions.get(node.id);
      }
    }

    // Merge custom edges and filter deleted edges
    edges = [...edges, ...this.customEdges].filter(e => !this.deletedEdges.has(e.id));

    return { nodes, edges };
  }

  private scanEntitiesRecursive(entitiesDir: string, nodes: ArchitectureNode[], edges: ArchitectureEdge[], parentName?: string) {
    if (!fs.existsSync(entitiesDir)) return;
    const entries = fs.readdirSync(entitiesDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const entityName = entry.name;
        const entityPath = path.join(entitiesDir, entityName);
        const entityTsFile = path.join(entityPath, `${entityName}.ts`);

        const entityNode: ArchitectureNode = {
          id: `entity:${entityName}`,
          type: 'entity',
          name: entityName,
          parentEntity: parentName,
          filePath: fs.existsSync(entityTsFile) ? entityTsFile : entityPath
        };
        nodes.push(entityNode);

        if (parentName) {
          edges.push({
            id: `edge:${parentName}->child:${entityName}`,
            source: `entity:${parentName}`,
            target: `entity:${entityName}`,
            type: 'contains',
            deletable: true
          });
        }

        const funcsDir = path.join(entityPath, 'functionalities');
        if (fs.existsSync(funcsDir)) {
          const funcs = fs.readdirSync(funcsDir, { withFileTypes: true });
          for (const fn of funcs) {
            if (fn.isDirectory()) {
              const fnName = fn.name;
              const fnPath = path.join(funcsDir, fnName);
              const logicFile = path.join(fnPath, 'main_function', 'logic.ts');

              const helpers: Array<{ name: string; filePath: string }> = [];
              const helpersDir = path.join(fnPath, 'helper_functions');
              if (fs.existsSync(helpersDir)) {
                for (const hf of fs.readdirSync(helpersDir)) {
                  if (hf.endsWith('.ts')) {
                    helpers.push({ name: hf.replace('.ts', ''), filePath: path.join(helpersDir, hf) });
                  }
                }
              }

              nodes.push({
                id: `functionality:${entityName}:${fnName}`,
                type: 'functionality',
                name: fnName,
                parentEntity: entityName,
                filePath: logicFile,
                helpers,
                uiSpec: fs.existsSync(path.join(fnPath, `${fnName}View.ts`))
              });

              edges.push({
                id: `edge:${entityName}->${fnName}`,
                source: `entity:${entityName}`,
                target: `functionality:${entityName}:${fnName}`,
                type: 'contains',
                deletable: true
              });
            }
          }
        }

        const childEntitiesDir = path.join(entityPath, 'entities');
        if (fs.existsSync(childEntitiesDir)) {
          this.scanEntitiesRecursive(childEntitiesDir, nodes, edges, entityName);
        }
      }
    }
  }

  // --- Graph Manipulation & Controls ---

  public moveNode(nodeId: string, x: number, y: number): { success: boolean; position: { x: number; y: number } } {
    this.recordHistory();
    this.nodePositions.set(nodeId, { x, y });
    this.persistGraphState();
    return { success: true, position: { x, y } };
  }

  public moveMultipleNodes(positions: Record<string, { x: number; y: number }>): { success: boolean } {
    this.recordHistory();
    for (const [id, pos] of Object.entries(positions)) {
      this.nodePositions.set(id, pos);
    }
    this.persistGraphState();
    return { success: true };
  }

  public connectNodes(source: string, target: string, type: 'contains' | 'dataflow' | 'flow_step' | 'uses_library' = 'dataflow'): { success: boolean; edge: ArchitectureEdge } {
    this.recordHistory();
    const edgeId = `edge:${source}->${target}:${Date.now()}`;
    const edge: ArchitectureEdge = { id: edgeId, source, target, type, deletable: true };
    this.customEdges.push(edge);
    this.deletedEdges.delete(edgeId);
    this.persistGraphState();
    return { success: true, edge };
  }

  public deleteEdge(edgeId: string): { success: boolean; deletedEdgeId: string } {
    this.recordHistory();
    this.deletedEdges.add(edgeId);
    this.customEdges = this.customEdges.filter(e => e.id !== edgeId);
    this.persistGraphState();
    return { success: true, deletedEdgeId: edgeId };
  }

  public deleteNode(nodeId: string): { success: boolean; deletedNodeId: string } {
    this.recordHistory();
    const graph = this.extractArchitectureGraph();
    const targetNode = graph.nodes.find(n => n.id === nodeId);
    if (targetNode && fs.existsSync(targetNode.filePath)) {
      const targetDir = fs.lstatSync(targetNode.filePath).isDirectory()
        ? targetNode.filePath
        : path.dirname(targetNode.filePath);
      
      // Safety: only delete inside project root src/
      if (targetDir.startsWith(path.join(this.projectRoot, 'src'))) {
        fs.rmSync(targetDir, { recursive: true, force: true });
      }
    }
    this.nodePositions.delete(nodeId);
    this.persistGraphState();
    return { success: true, deletedNodeId: nodeId };
  }

  public alignLayout(algorithm: 'hierarchical' | 'grid' = 'hierarchical'): { success: boolean; positions: Record<string, { x: number; y: number }> } {
    this.recordHistory();
    const graph = this.extractArchitectureGraph();
    const positions: Record<string, { x: number; y: number }> = {};

    const entities = graph.nodes.filter(n => n.type === 'entity');
    entities.forEach((node, idx) => {
      const col = Math.floor(idx / 5);
      const row = idx % 5;
      const x = 60 + col * 360;
      const y = 60 + row * 220;
      positions[node.id] = { x, y };
      this.nodePositions.set(node.id, { x, y });
    });

    const funcs = graph.nodes.filter(n => n.type === 'functionality');
    funcs.forEach((node, idx) => {
      const col = Math.floor(idx / 7);
      const row = idx % 7;
      const x = 800 + col * 320;
      const y = 60 + row * 180;
      positions[node.id] = { x, y };
      this.nodePositions.set(node.id, { x, y });
    });

    const others = graph.nodes.filter(n => n.type === 'library' || n.type === 'subapp');
    others.forEach((node, idx) => {
      const x = 1500;
      const y = 60 + idx * 160;
      positions[node.id] = { x, y };
      this.nodePositions.set(node.id, { x, y });
    });

    this.persistGraphState();
    return { success: true, positions };
  }

  private recordHistory() {
    this.undoStack.push(this.extractArchitectureGraph());
    if (this.undoStack.length > 50) this.undoStack.shift();
    this.redoStack = [];
  }

  public undo(): { success: boolean } {
    if (this.undoStack.length === 0) return { success: false };
    const prev = this.undoStack.pop()!;
    this.redoStack.push(this.extractArchitectureGraph());
    this.nodePositions.clear();
    for (const node of prev.nodes) {
      if (node.position) this.nodePositions.set(node.id, node.position);
    }
    this.persistGraphState();
    return { success: true };
  }

  public redo(): { success: boolean } {
    if (this.redoStack.length === 0) return { success: false };
    const next = this.redoStack.pop()!;
    this.undoStack.push(this.extractArchitectureGraph());
    this.nodePositions.clear();
    for (const node of next.nodes) {
      if (node.position) this.nodePositions.set(node.id, node.position);
    }
    this.persistGraphState();
    return { success: true };
  }

  public createEntity(name: string): { success: boolean; filePath: string } {
    this.recordHistory();
    const entitiesDir = path.join(this.projectRoot, 'src', 'entities');
    const entityDir = path.join(entitiesDir, name);
    fs.mkdirSync(entityDir, { recursive: true });

    const entityFile = path.join(entityDir, `${name}.ts`);
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
    fs.writeFileSync(entityFile, code, 'utf-8');
    return { success: true, filePath: entityFile };
  }

  public createFunctionality(entityName: string, name: string): { success: boolean; filesCreated: string[] } {
    this.recordHistory();
    const fnDir = path.join(this.projectRoot, 'src', 'entities', entityName, 'functionalities', name);
    fs.mkdirSync(path.join(fnDir, 'main_function'), { recursive: true });
    fs.mkdirSync(path.join(fnDir, 'state_data'), { recursive: true });
    fs.mkdirSync(path.join(fnDir, 'helper_functions'), { recursive: true });

    const atomFile = path.join(fnDir, `${name}Atom.ts`);
    const logicFile = path.join(fnDir, 'main_function', 'logic.ts');
    const stateFile = path.join(fnDir, 'state_data', 'state.ts');
    const helperFile = path.join(fnDir, 'helper_functions', 'executeStep.ts');

    fs.writeFileSync(atomFile, `export interface ${name}Input { payload?: any; }\nexport interface ${name}Output { success: boolean; timestamp: number; }\n`);
    fs.writeFileSync(stateFile, `export interface ${name}State { invocationCount: number; }\nexport const initialState: ${name}State = { invocationCount: 0 };\n`);
    fs.writeFileSync(helperFile, `export function executeStep(payload: any) { return { processed: true, data: payload }; }\n`);
    fs.writeFileSync(logicFile, `import { ${name}Input, ${name}Output } from '../${name}Atom.js';\nimport { executeStep } from '../helper_functions/executeStep.js';\n\nexport const main = async (input: ${name}Input, { state }: any): Promise<${name}Output> => {\n  executeStep(input.payload);\n  return { success: true, timestamp: Date.now() };\n};\n`);

    return { success: true, filesCreated: [atomFile, logicFile, stateFile, helperFile] };
  }

  public createLibrary(name: string): { success: boolean; filePath: string } {
    this.recordHistory();
    const cleanName = name.replace(/Concepts$/, '');
    const fullLibName = `${cleanName}Concepts`;
    const libDir = path.join(this.projectRoot, 'src', 'libraries');
    fs.mkdirSync(libDir, { recursive: true });
    const libFile = path.join(libDir, `${fullLibName}.ts`);

    const code = `/**\n * Layer 0: Pure Domain Concept Library\n */\nexport class ${fullLibName} {\n  static process(data: any): any {\n    return { valid: true, timestamp: Date.now() };\n  }\n}\n`;
    fs.writeFileSync(libFile, code, 'utf-8');
    return { success: true, filePath: libFile };
  }

  public addFlowStep(entityFilePath: string, flowName: string, stepFunctionName: string): boolean {
    this.recordHistory();
    const absPath = path.resolve(this.projectRoot, entityFilePath);
    if (!fs.existsSync(absPath)) return false;

    const sourceFile = this.project.addSourceFileAtPath(absPath);
    const classDec = sourceFile.getClasses()[0];
    if (!classDec) return false;

    const bootMethod = classDec.getMethod('boot');
    if (!bootMethod) return false;

    const body = bootMethod.getBody();
    if (!body || !Node.isBlock(body)) return false;

    const text = body.getText();
    if (text.includes(`this.flow('${flowName}')`)) {
      const lines = text.split('\n');
      const newLines = lines.map(line => {
        if (line.includes(`this.flow('${flowName}')`)) {
          return line.replace(`this.flow('${flowName}')`, `this.flow('${flowName}')\n      .then('${stepFunctionName}')`);
        }
        return line;
      });
      body.replaceWithText(newLines.join('\n'));
    } else {
      bootMethod.addStatements(`this.flow('${flowName}')\n  .then('${stepFunctionName}')\n  .register({ visibility: 'public' });`);
    }

    sourceFile.saveSync();
    return true;
  }
}
