interface ArchitectureNode {
    id: string;
    type: 'entity' | 'functionality' | 'library' | 'subapp' | 'flow';
    name: string;
    parentEntity?: string;
    filePath: string;
    inputs?: Array<{
        name: string;
        type: string;
    }>;
    outputs?: Array<{
        name: string;
        type: string;
    }>;
    stateFields?: Array<{
        name: string;
        type: string;
    }>;
    helpers?: Array<{
        name: string;
        filePath: string;
    }>;
    uiSpec?: boolean;
}
interface ArchitectureEdge {
    id: string;
    source: string;
    target: string;
    type: 'contains' | 'dataflow' | 'flow_step' | 'uses_library';
    deletable?: boolean;
}
interface ArchitectureGraph {
    nodes: ArchitectureNode[];
    edges: ArchitectureEdge[];
}
declare class AstMutationEngine {
    private projectRoot;
    private project;
    constructor(projectRoot?: string);
    /**
     * Scans the workspace and builds the full visual architecture graph.
     */
    extractArchitectureGraph(): ArchitectureGraph;
    private scanEntitiesRecursive;
    private parseFunctionalityQuadUnit;
    /**
     * Surgical AST Operation: Create Entity
     */
    createEntity(entityName: string): {
        success: boolean;
        filePath: string;
    };
    /**
     * Surgical AST Operation: Create Quad-Unit Functionality
     */
    createFunctionality(entityName: string, funcName: string): {
        success: boolean;
        filesCreated: string[];
    };
    /**
     * Surgical AST Operation: Create Domain Concept Library (Layer 0)
     */
    createLibrary(domainName: string): {
        success: boolean;
        filePath: string;
    };
    /**
     * Surgical AST Operation: Add Flow Connection (entity.flow().then().branch())
     */
    addFlowStep(entityFilePath: string, flowName: string, stepFunctionName: string): boolean;
}

interface FunctionExecutionRequest {
    filePath: string;
    functionName?: string;
    input?: any;
    state?: any;
}
interface FunctionExecutionResult {
    success: boolean;
    output?: any;
    durationMs: number;
    memoryDeltaBytes: number;
    error?: string;
    logs: string[];
}
declare class FunctionExecutor {
    /**
     * Executes a specific function in an isolated process/worker with performance metrics.
     */
    static execute(request: FunctionExecutionRequest): Promise<FunctionExecutionResult>;
}

type FileChangeCallback = (change: {
    eventType: string;
    filename: string;
    fullPath: string;
}) => void;
declare class StudioFileWatcher {
    private watcher;
    private rootDir;
    private listeners;
    private debounceTimers;
    constructor(rootDir?: string);
    start(): void;
    subscribe(cb: FileChangeCallback): () => void;
    stop(): void;
}

interface JsonRpcRequest {
    jsonrpc: '2.0';
    id?: string | number;
    method: string;
    params?: any;
}
interface JsonRpcResponse {
    jsonrpc: '2.0';
    id?: string | number;
    result?: any;
    error?: {
        code: number;
        message: string;
        data?: any;
    };
}
declare class JsonRpcRouter {
    private astEngine;
    private validator;
    private projectRoot;
    private onMutationCallback?;
    constructor(projectRoot?: string, onMutation?: (m: any) => void);
    setProjectRoot(newRoot: string): void;
    getProjectRoot(): string;
    handle(req: JsonRpcRequest): Promise<JsonRpcResponse>;
    private notifyMutation;
}

interface StudioServerOptions {
    port?: number;
    projectRoot?: string;
}
declare class StudioServer {
    private port;
    private projectRoot;
    private httpServer;
    private wss;
    private router;
    private watcher;
    private astEngine;
    constructor(options?: StudioServerOptions);
    private initWebSocket;
    private initFileWatcher;
    private broadcastGraphUpdate;
    private broadcastAgentActivity;
    private handleHttpRequest;
    private getStudioHtml;
    start(): Promise<void>;
    stop(): Promise<void>;
}

export { type ArchitectureEdge, type ArchitectureGraph, type ArchitectureNode, AstMutationEngine, type FileChangeCallback, type FunctionExecutionRequest, type FunctionExecutionResult, FunctionExecutor, type JsonRpcRequest, type JsonRpcResponse, JsonRpcRouter, StudioFileWatcher, StudioServer, type StudioServerOptions };
