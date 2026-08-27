import * as fs from 'fs';
import * as path from 'path';
import { AstMutationEngine } from './AstMutationEngine.js';
import { FunctionExecutor } from './FunctionExecutor.js';
import { KrnlValidatorEngine } from '@dinilmusick/krnl-validate';
import { PreemptiveDocManager } from './PreemptiveDocManager.js';
import { VanJSCodeGenerator } from '../client/ui-builder/VanJSCodeGenerator.js';

export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: string | number;
  method: string;
  params?: any;
}

export interface JsonRpcResponse {
  jsonrpc: '2.0';
  id?: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export class JsonRpcRouter {
  private astEngine: AstMutationEngine;
  private validator: KrnlValidatorEngine;
  private projectRoot: string;
  private onMutationCallback?: (mutation: { action: string; params: any }) => void;

  constructor(projectRoot: string = process.cwd(), onMutation?: (m: any) => void) {
    this.projectRoot = path.resolve(projectRoot);
    this.astEngine = new AstMutationEngine(this.projectRoot);
    this.validator = new KrnlValidatorEngine({ projectRoot: this.projectRoot });
    this.onMutationCallback = onMutation;
  }

  public setProjectRoot(newRoot: string) {
    this.projectRoot = path.resolve(newRoot);
    this.astEngine = new AstMutationEngine(this.projectRoot);
    this.validator = new KrnlValidatorEngine({ projectRoot: this.projectRoot });
  }

  public getProjectRoot(): string {
    return this.projectRoot;
  }

  public async handle(req: JsonRpcRequest): Promise<JsonRpcResponse> {
    try {
      const { method, params = {}, id } = req;

      switch (method) {
        // 1. Workspace
        case 'project.load':
        case 'project.switch': {
          const targetPath = params.path || params.projectPath;
          if (!targetPath) throw new Error('Path is required to load project');
          const abs = path.resolve(this.projectRoot, targetPath);
          if (!fs.existsSync(abs)) throw new Error(`Project directory not found: ${targetPath}`);
          this.setProjectRoot(abs);
          const graph = this.astEngine.extractArchitectureGraph();
          const decorated = PreemptiveDocManager.decorateResponse('project.load', { success: true, projectRoot: this.projectRoot, graph });
          return { jsonrpc: '2.0', id, result: decorated };
        }

        case 'graph.getArchitecture':
        case 'project.getArchitecture': {
          const graph = this.astEngine.extractArchitectureGraph();
          const decorated = PreemptiveDocManager.decorateResponse('graph.getArchitecture', graph);
          return { jsonrpc: '2.0', id, result: decorated };
        }

        case 'project.getStatus': {
          const graph = this.astEngine.extractArchitectureGraph();
          const summary = this.validator.validateAll();
          const status = {
            projectRoot: this.projectRoot,
            entityCount: graph.nodes.filter(n => n.type === 'entity').length,
            functionalityCount: graph.nodes.filter(n => n.type === 'functionality').length,
            libraryCount: graph.nodes.filter(n => n.type === 'library').length,
            subappCount: graph.nodes.filter(n => n.type === 'subapp').length,
            purityValid: summary.valid,
            purityErrors: summary.errors.length
          };
          const decorated = PreemptiveDocManager.decorateResponse('graph.getArchitecture', status);
          return { jsonrpc: '2.0', id, result: decorated };
        }

        // 2. Interactive Graph Controls & Layout
        case 'graph.moveNode': {
          const { nodeId, x, y } = params;
          if (!nodeId || x === undefined || y === undefined) throw new Error('nodeId, x, and y are required');
          const res = this.astEngine.moveNode(nodeId, x, y);
          this.notifyMutation('graph.moveNode', { nodeId, x, y });
          const decorated = PreemptiveDocManager.decorateResponse('graph.moveNode', res);
          return { jsonrpc: '2.0', id, result: decorated };
        }

        case 'graph.moveMultipleNodes': {
          const { positions } = params;
          if (!positions) throw new Error('positions map is required');
          const res = this.astEngine.moveMultipleNodes(positions);
          this.notifyMutation('graph.moveMultipleNodes', { count: Object.keys(positions).length });
          const decorated = PreemptiveDocManager.decorateResponse('graph.moveNode', res);
          return { jsonrpc: '2.0', id, result: decorated };
        }

        case 'graph.connectNodes': {
          const { source, target, type } = params;
          if (!source || !target) throw new Error('source and target node IDs are required');
          const res = this.astEngine.connectNodes(source, target, type);
          const graph = this.astEngine.extractArchitectureGraph();
          this.notifyMutation('graph.connectNodes', { source, target, ...res });
          const decorated = PreemptiveDocManager.decorateResponse('graph.connectNodes', { ...res, graph });
          return { jsonrpc: '2.0', id, result: decorated };
        }

        case 'graph.deleteEdge': {
          const { edgeId } = params;
          if (!edgeId) throw new Error('edgeId is required');
          const res = this.astEngine.deleteEdge(edgeId);
          const graph = this.astEngine.extractArchitectureGraph();
          this.notifyMutation('graph.deleteEdge', { edgeId });
          const decorated = PreemptiveDocManager.decorateResponse('graph.deleteEdge', { ...res, graph });
          return { jsonrpc: '2.0', id, result: decorated };
        }

        case 'graph.deleteNode': {
          const { nodeId } = params;
          if (!nodeId) throw new Error('nodeId is required');
          const res = this.astEngine.deleteNode(nodeId);
          const graph = this.astEngine.extractArchitectureGraph();
          this.notifyMutation('graph.deleteNode', { nodeId });
          const decorated = PreemptiveDocManager.decorateResponse('graph.deleteNode', { ...res, graph });
          return { jsonrpc: '2.0', id, result: decorated };
        }

        case 'graph.alignLayout': {
          const { algorithm } = params;
          const res = this.astEngine.alignLayout(algorithm);
          const graph = this.astEngine.extractArchitectureGraph();
          this.notifyMutation('graph.alignLayout', { algorithm: algorithm || 'hierarchical' });
          const decorated = PreemptiveDocManager.decorateResponse('graph.alignLayout', { ...res, graph });
          return { jsonrpc: '2.0', id, result: decorated };
        }

        case 'graph.undo': {
          const res = this.astEngine.undo();
          const graph = this.astEngine.extractArchitectureGraph();
          this.notifyMutation('graph.undo', {});
          const decorated = PreemptiveDocManager.decorateResponse('graph.undo', { ...res, graph });
          return { jsonrpc: '2.0', id, result: decorated };
        }

        case 'graph.redo': {
          const res = this.astEngine.redo();
          const graph = this.astEngine.extractArchitectureGraph();
          this.notifyMutation('graph.redo', {});
          const decorated = PreemptiveDocManager.decorateResponse('graph.redo', { ...res, graph });
          return { jsonrpc: '2.0', id, result: decorated };
        }

        // 3. Scaffolding
        case 'entity.create':
        case 'graph.createEntity': {
          const { name } = params;
          if (!name) throw new Error('Entity name is required');
          const res = this.astEngine.createEntity(name);
          const graph = this.astEngine.extractArchitectureGraph();
          this.notifyMutation('entity.create', { name, ...res });
          const decorated = PreemptiveDocManager.decorateResponse('entity.create', { ...res, graph });
          return { jsonrpc: '2.0', id, result: decorated };
        }

        case 'functionality.create':
        case 'graph.createFunctionality': {
          const { entityName, name } = params;
          if (!entityName || !name) throw new Error('entityName and name are required');
          const res = this.astEngine.createFunctionality(entityName, name);
          const graph = this.astEngine.extractArchitectureGraph();
          this.notifyMutation('functionality.create', { entityName, name, ...res });
          const decorated = PreemptiveDocManager.decorateResponse('functionality.create', { ...res, graph });
          return { jsonrpc: '2.0', id, result: decorated };
        }

        case 'library.create':
        case 'graph.createLibrary': {
          const { name } = params;
          if (!name) throw new Error('Library name is required');
          const res = this.astEngine.createLibrary(name);
          const graph = this.astEngine.extractArchitectureGraph();
          this.notifyMutation('library.create', { name, ...res });
          const decorated = PreemptiveDocManager.decorateResponse('library.create', { ...res, graph });
          return { jsonrpc: '2.0', id, result: decorated };
        }

        case 'flow.addStep':
        case 'graph.addFlowStep': {
          const { entityFilePath, flowName, stepFunctionName } = params;
          const success = this.astEngine.addFlowStep(entityFilePath, flowName, stepFunctionName);
          const graph = this.astEngine.extractArchitectureGraph();
          this.notifyMutation('flow.addStep', { flowName, stepFunctionName, success });
          const decorated = PreemptiveDocManager.decorateResponse('flow.addStep', { success, graph });
          return { jsonrpc: '2.0', id, result: decorated };
        }

        // 4. Code Mutation & Robust File Reading
        case 'file.read': {
          const { filePath } = params;
          let abs = path.isAbsolute(filePath) ? filePath : path.resolve(this.projectRoot, filePath);
          if (!fs.existsSync(abs)) throw new Error(`File not found: ${filePath}`);

          let content = '';
          if (fs.lstatSync(abs).isDirectory()) {
            const base = path.basename(abs);
            const candidateTs = path.join(abs, `${base}.ts`);
            const candidateIndex = path.join(abs, 'index.ts');
            if (fs.existsSync(candidateTs)) {
              abs = candidateTs;
              content = fs.readFileSync(candidateTs, 'utf-8');
            } else if (fs.existsSync(candidateIndex)) {
              abs = candidateIndex;
              content = fs.readFileSync(candidateIndex, 'utf-8');
            } else {
              const files = fs.readdirSync(abs);
              content = `// Directory: ${base}\n// Files in directory:\n` + files.map(f => `// - ${f}`).join('\n');
            }
          } else {
            content = fs.readFileSync(abs, 'utf-8');
          }

          const decorated = PreemptiveDocManager.decorateResponse('file.read', { filePath: abs, content });
          return { jsonrpc: '2.0', id, result: decorated };
        }

        case 'file.edit': {
          const { filePath, newContent } = params;
          const abs = path.resolve(this.projectRoot, filePath);
          fs.writeFileSync(abs, newContent, 'utf-8');
          this.notifyMutation('file.edit', { filePath });
          const decorated = PreemptiveDocManager.decorateResponse('file.edit', { success: true, filePath: abs });
          return { jsonrpc: '2.0', id, result: decorated };
        }

        case 'ui.generate': {
          const { componentTree, componentName, targetFilePath } = params;
          const code = VanJSCodeGenerator.generateCode(componentTree, componentName || 'GeneratedView');
          if (targetFilePath) {
            const abs = path.resolve(this.projectRoot, targetFilePath);
            fs.mkdirSync(path.dirname(abs), { recursive: true });
            fs.writeFileSync(abs, code, 'utf-8');
            this.notifyMutation('ui.generate', { targetFilePath });
          }
          const decorated = PreemptiveDocManager.decorateResponse('ui.generate', { code, targetFilePath });
          return { jsonrpc: '2.0', id, result: decorated };
        }

        // 5. Validation
        case 'validate.audit':
        case 'validate.runPurityAudit': {
          const summary = this.validator.validateAll();
          const decorated = PreemptiveDocManager.decorateResponse('validate.audit', summary);
          return { jsonrpc: '2.0', id, result: decorated };
        }

        // 6. Sandboxed Testing
        case 'test.executeFunction': {
          const result = await FunctionExecutor.execute(params);
          this.notifyMutation('test.executeFunction', { filePath: params.filePath, success: result.success, durationMs: result.durationMs });
          const decorated = PreemptiveDocManager.decorateResponse('test.executeFunction', result);
          return { jsonrpc: '2.0', id, result: decorated };
        }

        // 7. Documentation
        case 'docs.endpoints': {
          const all = PreemptiveDocManager.getAllEndpoints();
          const decorated = PreemptiveDocManager.decorateResponse('docs.endpoints', all);
          return { jsonrpc: '2.0', id, result: decorated };
        }

        default:
          return {
            jsonrpc: '2.0',
            id,
            error: { code: -32601, message: `Method '${method}' not found` }
          };
      }
    } catch (err: any) {
      return {
        jsonrpc: '2.0',
        id: req.id,
        error: { code: -32000, message: err?.message || String(err) }
      };
    }
  }

  private notifyMutation(action: string, params: any) {
    if (this.onMutationCallback) {
      this.onMutationCallback({ action, params });
    }
  }
}
