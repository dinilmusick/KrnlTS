import type { GraphEdge, GraphNode } from '@ultrst-armada/kloks/state-graph';
import type { KoneTransport } from './transport.js';

export type ExecutionLifecycle = 'IDLE' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'STOPPED' | 'FAILED';

export interface ExecutionGraph {
  id: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface ExecutionPayload {
  selection?: number;
  value?: unknown;
  source?: string;
  [key: string]: unknown;
}

export interface ExecutionNodeController {
  pause(): void | Promise<void>;
  resume(): void | Promise<void>;
  stop(): void | Promise<void>;
}

export interface ExecutionBranch {
  id: string;
  nodeId: string;
  state: ExecutionLifecycle;
  parentBranchId?: string;
  controller?: ExecutionNodeController;
  payload: ExecutionPayload;
}

export interface ExecutionInstance {
  id: string;
  graphId: string;
  state: ExecutionLifecycle;
  parentExecutionId?: string;
  parentNodeId?: string;
  branches: Map<string, ExecutionBranch>;
  children: Set<string>;
  entryNodeIds: string[];
  initialPayload: ExecutionPayload;
  transport?: KoneTransport;
}

export interface ExecutionNodeContext {
  runtime: import('./executionRuntime.js').ExecutionRuntime;
  execution: ExecutionInstance;
  branch: ExecutionBranch;
  node: GraphNode;
  graph: ExecutionGraph;
  payload: ExecutionPayload;
  transport?: KoneTransport;
}

export type ExecutionResult =
  | { status: 'COMPLETED'; payload?: ExecutionPayload; outputs?: string[] }
  | {
      status: 'WAITING';
      controller: ExecutionNodeController;
      completion: Promise<ExecutionPayload | void>;
      payload?: ExecutionPayload;
      outputs?: string[];
    }
  | { status: 'FAILED'; error: Error };

export type ExecutionNodeHandler = (
  context: ExecutionNodeContext,
) => Promise<ExecutionResult> | ExecutionResult;

export type NestedGraphResolver = (
  context: ExecutionNodeContext,
) => { graphId: string; entryNodeIds: string[]; payload?: ExecutionPayload } | undefined;

export interface ExecutionRuntimeOptions {
  selectionResolver?: (node: GraphNode, payload: ExecutionPayload, context: ExecutionNodeContext) => number;
  createSectionTransport?: (node: GraphNode, context: ExecutionNodeContext) => KoneTransport;
  onEvent?: (event: ExecutionEvent) => void;
}

export interface ExecutionEvent {
  type:
    | 'started'
    | 'paused'
    | 'resumed'
    | 'node-started'
    | 'node-completed'
    | 'node-failed'
    | 'branch-started'
    | 'branch-completed'
    | 'completed'
    | 'stopped'
    | 'failed';
  executionId: string;
  branchId?: string;
  nodeId?: string;
  parentExecutionId?: string;
  error?: Error;
}
