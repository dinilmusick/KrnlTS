interface ArchitectureNode {
    id: string;
    type: 'entity' | 'functionality' | 'library' | 'subapp' | 'flow';
    name: string;
    parentEntity?: string;
    filePath: string;
    position?: {
        x: number;
        y: number;
    };
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
    private customEdges;
    private deletedEdges;
    private nodePositions;
    private undoStack;
    private redoStack;
    constructor(projectRoot?: string);
    private getGraphStateFilePath;
    private loadPersistedGraphState;
    private persistGraphState;
    extractArchitectureGraph(): ArchitectureGraph;
    private scanEntitiesRecursive;
    moveNode(nodeId: string, x: number, y: number): {
        success: boolean;
        position: {
            x: number;
            y: number;
        };
    };
    moveMultipleNodes(positions: Record<string, {
        x: number;
        y: number;
    }>): {
        success: boolean;
    };
    connectNodes(source: string, target: string, type?: 'contains' | 'dataflow' | 'flow_step' | 'uses_library'): {
        success: boolean;
        edge: ArchitectureEdge;
    };
    deleteEdge(edgeId: string): {
        success: boolean;
        deletedEdgeId: string;
    };
    deleteNode(nodeId: string): {
        success: boolean;
        deletedNodeId: string;
    };
    alignLayout(algorithm?: 'hierarchical' | 'grid'): {
        success: boolean;
        positions: Record<string, {
            x: number;
            y: number;
        }>;
    };
    private recordHistory;
    undo(): {
        success: boolean;
    };
    redo(): {
        success: boolean;
    };
    createEntity(name: string): {
        success: boolean;
        filePath: string;
    };
    createFunctionality(entityName: string, name: string): {
        success: boolean;
        filesCreated: string[];
    };
    createLibrary(name: string): {
        success: boolean;
        filePath: string;
    };
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
     * Executes a specific function, entity, or library in an isolated sandbox with metrics.
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
