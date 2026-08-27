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
  functionalities?: string[];
  events?: string[];
  methods?: Array<{ name: string; params: string[] }>;
  helpers?: Array<{ name: string; filePath: string }>;
  uiSpec?: boolean;
  uiFilePath?: string;
  examplePayload?: any;
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
            const libMeta = this.extractLibraryMetadata(libPath, baseName);
            nodes.push({
              id: `library:${baseName}`,
              type: 'library',
              name: baseName,
              filePath: libPath,
              uiSpec: libMeta.uiSpec,
              uiFilePath: libMeta.uiFilePath,
              methods: libMeta.methods,
              examplePayload: libMeta.examplePayload
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
            const saMeta = this.extractSubappMetadata(saPath, saName);
            nodes.push({
              id: `subapp:${saName}`,
              type: 'subapp',
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
        const entityUi = this.findUiFile(entityPath, entityName);

        const funcsDir = path.join(entityPath, 'functionalities');
        const entityFunctionalityNames: string[] = [];
        if (fs.existsSync(funcsDir)) {
          const funcs = fs.readdirSync(funcsDir, { withFileTypes: true });
          for (const fn of funcs) {
            if (fn.isDirectory()) {
              entityFunctionalityNames.push(fn.name);
            }
          }
        }

        const entityNode: ArchitectureNode = {
          id: `entity:${entityName}`,
          type: 'entity',
          name: entityName,
          parentEntity: parentName,
          filePath: fs.existsSync(entityTsFile) ? entityTsFile : entityPath,
          uiSpec: entityUi.uiSpec,
          uiFilePath: entityUi.uiFilePath,
          functionalities: entityFunctionalityNames,
          examplePayload: {
            entityId: entityName,
            action: 'boot',
            config: { debug: true, environment: 'sandbox' }
          }
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

              const fnUi = this.findUiFile(fnPath, fnName);
              const atomMeta = this.extractFunctionalityMetadata(fnPath, fnName);

              nodes.push({
                id: `functionality:${entityName}:${fnName}`,
                type: 'functionality',
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

  /**
   * Introspects functionality Atom & State files to extract types and synthesize realistic example payloads.
   */
  private extractFunctionalityMetadata(fnPath: string, fnName: string): {
    inputs: Array<{ name: string; type: string }>;
    outputs: Array<{ name: string; type: string }>;
    stateFields: Array<{ name: string; type: string }>;
    examplePayload: any;
  } {
    const inputs: Array<{ name: string; type: string }> = [];
    const outputs: Array<{ name: string; type: string }> = [];
    const stateFields: Array<{ name: string; type: string }> = [];
    let examplePayload: any = null;

    // 1. Check for dedicated payload file on disk
    const payloadFiles = ['example.json', 'payload.json', 'test-input.json', 'input.json'];
    for (const pf of payloadFiles) {
      const p = path.join(fnPath, pf);
      if (fs.existsSync(p)) {
        try {
          examplePayload = JSON.parse(fs.readFileSync(p, 'utf-8'));
          break;
        } catch (e) {}
      }
    }

    // 2. Parse Atom TS interfaces
    const atomCandidates = [
      path.join(fnPath, `${fnName}Atom.ts`),
      path.join(fnPath, `${fnName}Atom.js`),
      path.join(fnPath, 'atom.ts'),
      path.join(fnPath, 'types.ts')
    ];
    const atomPath = atomCandidates.find(c => fs.existsSync(c));

    if (atomPath) {
      try {
        const atomContent = fs.readFileSync(atomPath, 'utf-8');
        const synthPayload: Record<string, any> = {};

        // Parse Input Interface
        const inputMatch = atomContent.match(/export\s+interface\s+\w+Input\s*\{([^}]+)\}/s) ||
                           atomContent.match(/interface\s+\w+Input\s*\{([^}]+)\}/s);
        if (inputMatch && inputMatch[1]) {
          const lines = inputMatch[1].split('\n');
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

        // Parse Output Interface
        const outputMatch = atomContent.match(/export\s+interface\s+\w+Output\s*\{([^}]+)\}/s) ||
                            atomContent.match(/interface\s+\w+Output\s*\{([^}]+)\}/s);
        if (outputMatch && outputMatch[1]) {
          const lines = outputMatch[1].split('\n');
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
      } catch (e) {}
    }

    // 3. Parse State Data
    const stateFile = path.join(fnPath, 'state_data', 'state.ts');
    if (fs.existsSync(stateFile)) {
      try {
        const stateContent = fs.readFileSync(stateFile, 'utf-8');
        const stateMatch = stateContent.match(/export\s+interface\s+\w+State\s*\{([^}]+)\}/s);
        if (stateMatch && stateMatch[1]) {
          const lines = stateMatch[1].split('\n');
          for (const line of lines) {
            const propMatch = line.trim().match(/^([a-zA-Z0-9_$]+)\??\s*:\s*([^;]+);?/);
            if (propMatch) {
              stateFields.push({ name: propMatch[1], type: propMatch[2].trim() });
            }
          }
        }
      } catch (e) {}
    }

    // Fallback default payload if empty
    if (!examplePayload) {
      if (fnName.includes('Calc')) {
        examplePayload = { op: 'add', a: 10, b: 25 };
      } else if (fnName.includes('Order') || fnName.includes('Cart')) {
        examplePayload = { productId: 'PROD-9821', quantity: 2, price: 49.99 };
      } else {
        examplePayload = { payload: `Sample input for ${fnName}` };
      }
    }

    return { inputs, outputs, stateFields, examplePayload };
  }

  /**
   * Introspects Concept Libraries to extract methods and example payloads.
   */
  private extractLibraryMetadata(libPath: string, baseName: string): {
    examplePayload: any;
    uiSpec: boolean;
    uiFilePath?: string;
    methods?: Array<{ name: string; params: string[] }>;
  } {
    const ui = this.findUiFile(path.dirname(libPath), baseName);
    let examplePayload: any = null;
    let extractedMethods: Array<{ name: string; params: string[] }> = [];

    try {
      const content = fs.readFileSync(libPath, 'utf-8');
      
      // Look for static methods: static methodName(param1, param2)
      const staticMethodRegex = /static\s+([a-zA-Z0-9_$]+)\s*\(([^)]*)\)/g;
      let match;
      const methods: Array<{ name: string; params: string[] }> = [];

      while ((match = staticMethodRegex.exec(content)) !== null) {
        const mName = match[1];
        const rawParams = match[2].trim();
        const paramNames = rawParams ? rawParams.split(',').map(p => p.trim().split(':')[0].trim()) : [];
        methods.push({ name: mName, params: paramNames });
      }
      extractedMethods = methods;

      if (methods.length > 0) {
        const primary = methods[0];
        if (primary.params.length > 1) {
          const sampleArgs: any[] = [];
          for (const p of primary.params) {
            sampleArgs.push(this.synthesizeDefaultValue(p, 'number'));
          }
          examplePayload = { method: primary.name, args: sampleArgs };
        } else if (primary.params.length === 1) {
          const pName = primary.params[0];
          examplePayload = { method: primary.name, args: [this.synthesizeDefaultValue(pName, 'object')] };
        } else {
          examplePayload = { method: primary.name, args: [] };
        }
      }
    } catch (e) {}

    if (!examplePayload) {
      if (baseName.includes('Math')) {
        examplePayload = { method: 'add', args: [15, 30] };
      } else if (baseName.includes('Commerce')) {
        examplePayload = { method: 'validateCart', args: [{ items: [{ productId: 'PROD-101', quantity: 2, price: 29.99 }] }] };
      } else {
        examplePayload = { method: 'process', args: [{ data: 'sample' }] };
      }
    }

    return { examplePayload, uiSpec: ui.uiSpec, uiFilePath: ui.uiFilePath, methods: extractedMethods };
  }

  /**
   * Introspects SubApps to locate UI entries and operations.
   */
  private extractSubappMetadata(saPath: string, saName: string): {
    examplePayload: any;
    uiSpec: boolean;
    uiFilePath?: string;
  } {
    const ui = this.findUiFile(saPath, saName);
    let examplePayload: any = null;

    // Check subapp.json
    const manifestPath = path.join(saPath, 'subapp.json');
    if (fs.existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
        if (manifest.ui && manifest.ui.entryPath && !ui.uiFilePath) {
          const entryAbs = path.resolve(saPath, manifest.ui.entryPath);
          if (fs.existsSync(entryAbs)) {
            ui.uiSpec = true;
            ui.uiFilePath = entryAbs;
          }
        }
      } catch (e) {}
    }

    // Check operations directory
    const opsDir = path.join(saPath, 'operations');
    if (fs.existsSync(opsDir)) {
      const ops = fs.readdirSync(opsDir).filter(f => f.endsWith('.ts') || f.endsWith('.js'));
      if (ops.length > 0) {
        const firstOp = ops[0].replace(/\.(ts|js)$/, '');
        examplePayload = { operation: firstOp, payload: { action: 'execute', timestamp: Date.now() } };
      }
    }

    if (!examplePayload) {
      examplePayload = { action: 'initialize', subapp: saName, context: { debug: true } };
    }

    return { examplePayload, uiSpec: ui.uiSpec, uiFilePath: ui.uiFilePath };
  }

  /**
   * Helper to scan for UI files across multiple standard conventions.
   */
  private findUiFile(dirPath: string, baseName: string): { uiSpec: boolean; uiFilePath?: string } {
    const candidates = [
      path.join(dirPath, `${baseName}View.tsx`),
      path.join(dirPath, `${baseName}View.ts`),
      path.join(dirPath, `${baseName}.view.tsx`),
      path.join(dirPath, `${baseName}.view.ts`),
      path.join(dirPath, 'ui', `${baseName}View.tsx`),
      path.join(dirPath, 'ui', `${baseName}View.ts`),
      path.join(dirPath, 'ui', 'App.tsx'),
      path.join(dirPath, 'ui', 'index.tsx'),
      path.join(dirPath, 'src', 'ui', 'App.tsx'),
      path.join(dirPath, 'src', 'ui', 'index.tsx'),
      path.join(dirPath, 'view.tsx'),
      path.join(dirPath, 'view.ts')
    ];

    for (const c of candidates) {
      if (fs.existsSync(c)) {
        return { uiSpec: true, uiFilePath: c };
      }
    }

    return { uiSpec: false };
  }

  /**
   * Synthesizes realistic, intelligent mock values from property names and TypeScript types.
   */
  private synthesizeDefaultValue(propName: string, typeText: string): any {
    const lowerName = propName.toLowerCase();
    const cleanType = typeText.replace(/\s+/g, ' ').trim();

    // 1. Union string literals: 'add' | 'subtract' | 'multiply'
    if (cleanType.includes('|') && (cleanType.includes("'") || cleanType.includes('"'))) {
      const match = cleanType.match(/['"]([^'"]+)['"]/);
      if (match) return match[1];
    }

    // 2. Number types
    if (cleanType.startsWith('number')) {
      if (lowerName.includes('price') || lowerName.includes('cost') || lowerName.includes('amount') || lowerName.includes('subtotal')) {
        return 49.99;
      }
      if (lowerName.includes('qty') || lowerName.includes('quantity') || lowerName.includes('count') || lowerName.includes('itemcount')) {
        return 2;
      }
      if (lowerName === 'a') return 10;
      if (lowerName === 'b') return 25;
      if (lowerName.includes('port')) return 8080;
      if (lowerName.includes('id') || lowerName.includes('code')) return 1001;
      return 10;
    }

    // 3. String types
    if (cleanType.startsWith('string')) {
      if (lowerName.includes('productid') || lowerName.includes('product_id') || lowerName.includes('itemid')) {
        return 'PROD-9821';
      }
      if (lowerName.includes('orderid') || lowerName.includes('order_id')) {
        return 'ORD-1049';
      }
      if (lowerName.includes('userid') || lowerName.includes('user_id')) {
        return 'USR-4402';
      }
      if (lowerName.includes('email')) {
        return 'alex.developer@krnl.io';
      }
      if (lowerName.includes('name')) {
        return 'Premium Subscription';
      }
      if (lowerName.includes('url')) {
        return 'https://api.krnl.io/v1/stream';
      }
      if (lowerName === 'op' || lowerName === 'operation') {
        return 'add';
      }
      return `Sample ${propName}`;
    }

    // 4. Boolean types
    if (cleanType.startsWith('boolean')) {
      return true;
    }

    // 5. Array types
    if (cleanType.endsWith('[]') || cleanType.startsWith('Array<')) {
      if (lowerName.includes('item') || lowerName.includes('product')) {
        return [{ id: 'ITEM-1', name: 'Standard Item', price: 29.99, quantity: 1 }];
      }
      return ['sample-item-1', 'sample-item-2'];
    }

    // 6. Object / Generic fallback
    if (cleanType.startsWith('Record') || cleanType.startsWith('object') || cleanType === 'any') {
      return { sampleKey: 'sampleValue' };
    }

    return 'sample';
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
