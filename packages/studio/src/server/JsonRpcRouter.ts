import { AstMutationEngine } from './AstMutationEngine.js';
import { FunctionExecutor } from './FunctionExecutor.js';
import { KrnlValidatorEngine } from '@dinilmusick/krnl-validate';

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

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
    this.astEngine = new AstMutationEngine(projectRoot);
    this.validator = new KrnlValidatorEngine({ projectRoot });
  }

  public async handle(req: JsonRpcRequest): Promise<JsonRpcResponse> {
    try {
      const { method, params = {}, id } = req;

      switch (method) {
        case 'graph.getArchitecture': {
          const graph = this.astEngine.extractArchitectureGraph();
          return { jsonrpc: '2.0', id, result: graph };
        }

        case 'graph.createEntity': {
          const { name } = params;
          if (!name) throw new Error('Entity name is required');
          const res = this.astEngine.createEntity(name);
          const graph = this.astEngine.extractArchitectureGraph();
          return { jsonrpc: '2.0', id, result: { ...res, graph } };
        }

        case 'graph.createFunctionality': {
          const { entityName, name } = params;
          if (!entityName || !name) throw new Error('entityName and name are required');
          const res = this.astEngine.createFunctionality(entityName, name);
          const graph = this.astEngine.extractArchitectureGraph();
          return { jsonrpc: '2.0', id, result: { ...res, graph } };
        }

        case 'graph.createLibrary': {
          const { name } = params;
          if (!name) throw new Error('Library name is required');
          const res = this.astEngine.createLibrary(name);
          const graph = this.astEngine.extractArchitectureGraph();
          return { jsonrpc: '2.0', id, result: { ...res, graph } };
        }

        case 'graph.addFlowStep': {
          const { entityFilePath, flowName, stepFunctionName } = params;
          const success = this.astEngine.addFlowStep(entityFilePath, flowName, stepFunctionName);
          const graph = this.astEngine.extractArchitectureGraph();
          return { jsonrpc: '2.0', id, result: { success, graph } };
        }

        case 'test.executeFunction': {
          const result = await FunctionExecutor.execute(params);
          return { jsonrpc: '2.0', id, result };
        }

        case 'validate.runPurityAudit': {
          const summary = this.validator.validateAll();
          return { jsonrpc: '2.0', id, result: summary };
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
}
