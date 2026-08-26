export interface EndpointMetadata {
  id: string;
  method: 'GET' | 'POST';
  path: string;
  rpcMethod: string;
  title: string;
  description: string;
  category: 'Workspace' | 'Scaffolding' | 'GraphControls' | 'CodeMutation' | 'Validation' | 'Testing' | 'Documentation';
  payloadSchema: Record<string, string>;
  examplePayload: any;
  nextSuggestedEndpoints: string[];
}

export class PreemptiveDocManager {
  private static endpoints: Record<string, EndpointMetadata> = {
    // 1. Workspace
    'project.create': {
      id: 'project.create',
      method: 'POST',
      path: '/api/v1/project/create',
      rpcMethod: 'project.create',
      title: 'Create Project Workspace',
      description: 'Initializes a new Krnl full-stack workspace with standard quad-units, configs, and entity roots.',
      category: 'Workspace',
      payloadSchema: { name: 'string', targetDir: 'string (optional)', options: 'object (optional)' },
      examplePayload: { name: 'PaymentApp', targetDir: './projects/PaymentApp' },
      nextSuggestedEndpoints: ['entity.create', 'library.create', 'graph.getArchitecture']
    },
    'project.load': {
      id: 'project.load',
      method: 'POST',
      path: '/api/v1/project/load',
      rpcMethod: 'project.load',
      title: 'Load Project Workspace',
      description: 'Switches the active workspace context and synchronizes the visual node graph and file watcher.',
      category: 'Workspace',
      payloadSchema: { path: 'string (absolute or relative project path)' },
      examplePayload: { path: 'examples/unified-workspace' },
      nextSuggestedEndpoints: ['graph.getArchitecture', 'validate.audit', 'test.executeFunction']
    },
    'graph.getArchitecture': {
      id: 'graph.getArchitecture',
      method: 'GET',
      path: '/api/v1/project/graph',
      rpcMethod: 'graph.getArchitecture',
      title: 'Get Architecture Graph',
      description: 'Inspects source files on disk and returns the complete hierarchical entity, quad-unit, and concept library graph.',
      category: 'Workspace',
      payloadSchema: {},
      examplePayload: {},
      nextSuggestedEndpoints: ['entity.create', 'functionality.create', 'validate.audit']
    },

    // 2. Interactive Graph Controls & Layout
    'graph.moveNode': {
      id: 'graph.moveNode',
      method: 'POST',
      path: '/api/v1/graph/moveNode',
      rpcMethod: 'graph.moveNode',
      title: 'Move Node Coordinates',
      description: 'Updates and persists the (x, y) canvas coordinates of a specific node in real time.',
      category: 'GraphControls',
      payloadSchema: { nodeId: 'string', x: 'number', y: 'number' },
      examplePayload: { nodeId: 'entity:TradingSystem', x: 250, y: 180 },
      nextSuggestedEndpoints: ['graph.connectNodes', 'graph.getArchitecture']
    },
    'graph.connectNodes': {
      id: 'graph.connectNodes',
      method: 'POST',
      path: '/api/v1/graph/connectNodes',
      rpcMethod: 'graph.connectNodes',
      title: 'Establish Wire Connection',
      description: 'Creates a directional wire connection between two nodes with support for auto-spawn and dataflow.',
      category: 'GraphControls',
      payloadSchema: { source: 'string', target: 'string', type: 'string (optional: dataflow/contains/flow_step)' },
      examplePayload: { source: 'entity:TradingSystem', target: 'functionality:TradingSystem:ExecuteTrade', type: 'contains' },
      nextSuggestedEndpoints: ['graph.moveNode', 'graph.deleteEdge']
    },
    'graph.deleteEdge': {
      id: 'graph.deleteEdge',
      method: 'POST',
      path: '/api/v1/graph/deleteEdge',
      rpcMethod: 'graph.deleteEdge',
      title: 'Delete Connection (Via Centered Gizmo)',
      description: 'Deletes a wire connection identified by its edge ID.',
      category: 'GraphControls',
      payloadSchema: { edgeId: 'string' },
      examplePayload: { edgeId: 'edge:TradingSystem->QuotePrice' },
      nextSuggestedEndpoints: ['graph.connectNodes', 'graph.alignLayout']
    },
    'graph.deleteNode': {
      id: 'graph.deleteNode',
      method: 'POST',
      path: '/api/v1/graph/deleteNode',
      rpcMethod: 'graph.deleteNode',
      title: 'Delete Node & Source Assets',
      description: 'Removes a node from the visual graph and safely cleans up its underlying source files from the workspace.',
      category: 'GraphControls',
      payloadSchema: { nodeId: 'string' },
      examplePayload: { nodeId: 'functionality:TradingSystem:QuotePrice' },
      nextSuggestedEndpoints: ['graph.getArchitecture', 'validate.audit']
    },
    'graph.alignLayout': {
      id: 'graph.alignLayout',
      method: 'POST',
      path: '/api/v1/graph/alignLayout',
      rpcMethod: 'graph.alignLayout',
      title: 'Auto-Align Hierarchical Layout',
      description: 'Re-computes clean hierarchical column-based coordinates for all nodes on the canvas.',
      category: 'GraphControls',
      payloadSchema: { algorithm: 'string (optional: hierarchical/grid)' },
      examplePayload: { algorithm: 'hierarchical' },
      nextSuggestedEndpoints: ['graph.getArchitecture', 'graph.moveNode']
    },
    'graph.undo': {
      id: 'graph.undo',
      method: 'POST',
      path: '/api/v1/graph/undo',
      rpcMethod: 'graph.undo',
      title: 'Undo Graph Mutation',
      description: 'Reverts the previous canvas or node manipulation step.',
      category: 'GraphControls',
      payloadSchema: {},
      examplePayload: {},
      nextSuggestedEndpoints: ['graph.redo', 'graph.getArchitecture']
    },
    'graph.redo': {
      id: 'graph.redo',
      method: 'POST',
      path: '/api/v1/graph/redo',
      rpcMethod: 'graph.redo',
      title: 'Redo Graph Mutation',
      description: 'Re-applies the previously undone canvas action.',
      category: 'GraphControls',
      payloadSchema: {},
      examplePayload: {},
      nextSuggestedEndpoints: ['graph.undo', 'graph.getArchitecture']
    },

    // 3. Scaffolding
    'entity.create': {
      id: 'entity.create',
      method: 'POST',
      path: '/api/v1/entity/create',
      rpcMethod: 'graph.createEntity',
      title: 'Scaffold Entity',
      description: 'Surgically creates a new root or component Entity on disk with magnetic auto-discovery hooks.',
      category: 'Scaffolding',
      payloadSchema: { name: 'string (e.g. OrderSystem)' },
      examplePayload: { name: 'OrderSystem' },
      nextSuggestedEndpoints: ['functionality.create', 'flow.addStep', 'library.create']
    },
    'functionality.create': {
      id: 'functionality.create',
      method: 'POST',
      path: '/api/v1/functionality/create',
      rpcMethod: 'graph.createFunctionality',
      title: 'Scaffold Quad-Unit Functionality',
      description: 'Generates a 4-layer quad-unit (Atom, logic.ts, state.ts, helper_functions/) nested in the target Entity.',
      category: 'Scaffolding',
      payloadSchema: { entityName: 'string', name: 'string (functionality name)' },
      examplePayload: { entityName: 'OrderSystem', name: 'CreateOrder' },
      nextSuggestedEndpoints: ['test.executeFunction', 'flow.addStep', 'file.edit']
    },
    'library.create': {
      id: 'library.create',
      method: 'POST',
      path: '/api/v1/library/create',
      rpcMethod: 'graph.createLibrary',
      title: 'Scaffold Domain Concept Library',
      description: 'Generates a Layer 0 pure domain concept library ({Domain}Concepts.ts) with zero I/O side effects.',
      category: 'Scaffolding',
      payloadSchema: { name: 'string (e.g. Crypto)' },
      examplePayload: { name: 'Crypto' },
      nextSuggestedEndpoints: ['file.edit', 'functionality.create', 'validate.audit']
    },
    'flow.addStep': {
      id: 'flow.addStep',
      method: 'POST',
      path: '/api/v1/flow/addStep',
      rpcMethod: 'graph.addFlowStep',
      title: 'Inject Flow Step',
      description: 'Surgically adds a .then() or .branch() step into an Entity boot flow pipeline without disturbing existing code.',
      category: 'Scaffolding',
      payloadSchema: { entityFilePath: 'string', flowName: 'string', stepFunctionName: 'string' },
      examplePayload: {
        entityFilePath: 'src/entities/OrderSystem/OrderSystem.ts',
        flowName: 'CheckoutFlow',
        stepFunctionName: 'CreateOrder'
      },
      nextSuggestedEndpoints: ['test.executeFunction', 'validate.audit']
    },

    // 4. Code Mutation
    'file.read': {
      id: 'file.read',
      method: 'POST',
      path: '/api/v1/file/read',
      rpcMethod: 'file.read',
      title: 'Read Source File',
      description: 'Reads exact source code and metadata of any file in the workspace.',
      category: 'CodeMutation',
      payloadSchema: { filePath: 'string (absolute or relative)' },
      examplePayload: { filePath: 'src/entities/App/functionalities/Hello/main_function/logic.ts' },
      nextSuggestedEndpoints: ['file.edit', 'test.executeFunction']
    },
    'file.edit': {
      id: 'file.edit',
      method: 'POST',
      path: '/api/v1/file/edit',
      rpcMethod: 'file.edit',
      title: 'Surgical File Mutation',
      description: 'Surgically updates or replaces targeted code blocks in a TypeScript file while preserving comments and formatting.',
      category: 'CodeMutation',
      payloadSchema: { filePath: 'string', newContent: 'string' },
      examplePayload: { filePath: 'src/.../logic.ts', newContent: 'export const main = async () => ({ ok: true });' },
      nextSuggestedEndpoints: ['validate.audit', 'test.executeFunction']
    },
    'ui.generate': {
      id: 'ui.generate',
      method: 'POST',
      path: '/api/v1/ui/generate',
      rpcMethod: 'ui.generate',
      title: 'Generate VanJS UI Source',
      description: 'Compiles a visual component tree JSON into clean, reactive VanJS TypeScript source code.',
      category: 'CodeMutation',
      payloadSchema: { componentTree: 'object', targetFilePath: 'string (optional)' },
      examplePayload: { componentTree: { type: 'KrnlButton', props: { icon: '🚀' } } },
      nextSuggestedEndpoints: ['file.edit', 'validate.audit']
    },

    // 5. Validation & Quality Gates
    'validate.audit': {
      id: 'validate.audit',
      method: 'POST',
      path: '/api/v1/validate/audit',
      rpcMethod: 'validate.runPurityAudit',
      title: 'Run AST 4-Layer Purity Audit',
      description: 'Runs deep AST analysis across the workspace checking 4-layer function purity, 200-line limits, anti-polling, and import suffixes.',
      category: 'Validation',
      payloadSchema: { projectPath: 'string (optional)' },
      examplePayload: {},
      nextSuggestedEndpoints: ['test.executeFunction', 'graph.getArchitecture']
    },

    // 6. Sandboxed Testing
    'test.executeFunction': {
      id: 'test.executeFunction',
      method: 'POST',
      path: '/api/v1/test/execute',
      rpcMethod: 'test.executeFunction',
      title: 'Execute Function in Isolated Sandbox',
      description: 'Invokes any targeted function in an isolated Node.js Worker sandbox, capturing output, latency (ms), and memory delta.',
      category: 'Testing',
      payloadSchema: { filePath: 'string', functionName: 'string (optional)', input: 'object' },
      examplePayload: {
        filePath: 'src/entities/CalculatorSystem/functionalities/Calculate/main_function/logic.ts',
        input: { op: 'add', a: 10, b: 20 }
      },
      nextSuggestedEndpoints: ['validate.audit', 'flow.addStep']
    },

    // 7. Documentation
    'docs.endpoints': {
      id: 'docs.endpoints',
      method: 'GET',
      path: '/api/v1/docs/endpoints',
      rpcMethod: 'docs.endpoints',
      title: 'Get Full API Documentation Catalog',
      description: 'Returns the full list of all available Krnl Studio agentic endpoints with schemas, examples, and next steps.',
      category: 'Documentation',
      payloadSchema: {},
      examplePayload: {},
      nextSuggestedEndpoints: ['graph.getArchitecture', 'entity.create']
    }
  };

  public static getAllEndpoints(): EndpointMetadata[] {
    return Object.values(this.endpoints);
  }

  public static getEndpoint(id: string): EndpointMetadata | undefined {
    return this.endpoints[id];
  }

  public static decorateResponse(actionId: string, payload: any, host: string = 'localhost:8080'): any {
    const ep = this.endpoints[actionId];
    const nextSteps = (ep?.nextSuggestedEndpoints || ['graph.getArchitecture', 'validate.audit', 'test.executeFunction'])
      .map(nextId => {
        const nextMeta = this.endpoints[nextId];
        if (!nextMeta) return null;
        return {
          id: nextMeta.id,
          title: nextMeta.title,
          endpoint: `${nextMeta.method} ${nextMeta.path}`,
          rpcMethod: nextMeta.rpcMethod,
          description: nextMeta.description,
          examplePayload: nextMeta.examplePayload,
          curl: nextMeta.method === 'GET'
            ? `curl -X GET http://${host}${nextMeta.path}`
            : `curl -X POST http://${host}${nextMeta.path} -H 'Content-Type: application/json' -d '${JSON.stringify(nextMeta.examplePayload)}'`
        };
      })
      .filter(Boolean);

    return {
      status: 'success',
      payload,
      preemptiveDocumentation: {
        action: actionId,
        description: ep?.description || `Executed ${actionId}`,
        suggestedNextSteps: nextSteps,
        documentationIndexEndpoint: `GET http://${host}/api/v1/docs/endpoints`
      }
    };
  }
}
