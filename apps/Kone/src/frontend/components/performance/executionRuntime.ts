import type { GraphNode } from '@ultrst-armada/kloks/state-graph';
import type { ExecutionBranch, ExecutionEvent, ExecutionGraph, ExecutionInstance, ExecutionNodeContext, ExecutionNodeHandler, ExecutionPayload, ExecutionResult, ExecutionRuntimeOptions, NestedGraphResolver } from './executionRuntimeTypes.js';
export type * from './executionRuntimeTypes.js';
export class ExecutionRuntime {
  private readonly graphs = new Map<string, ExecutionGraph>();
  private readonly handlers = new Map<string, ExecutionNodeHandler>();
  private readonly nested = new Map<string, NestedGraphResolver>();
  private readonly executions = new Map<string, ExecutionInstance>();
  private readonly waiters = new Map<string, Set<(e: ExecutionInstance) => void>>();
  private sequence = 0;
  constructor(private readonly options: ExecutionRuntimeOptions = {}) {
    this.registerNodeHandler('button', () => ({ status: 'COMPLETED' }));
    this.registerNodeHandler('immediate', () => ({ status: 'COMPLETED' }));
  }
  registerGraph(graph: ExecutionGraph): void { this.graphs.set(graph.id, graph); }
  registerNodeHandler(type: string, handler: ExecutionNodeHandler): void { this.handlers.set(type, handler); }
  registerNestedNode(type: string, resolver: NestedGraphResolver): void { this.nested.set(type, resolver); }
  getExecution(id: string): ExecutionInstance | undefined { return this.executions.get(id); }
  waitForCompletion(id: string): Promise<ExecutionInstance> {
    const e = this.requireExecution(id);
    if (e.state === 'COMPLETED' || e.state === 'FAILED' || e.state === 'STOPPED') return Promise.resolve(e);
    return new Promise((resolve) => {
      const set = this.waiters.get(id) ?? new Set<(e: ExecutionInstance) => void>();
      set.add(resolve); this.waiters.set(id, set);
    });
  }
  async trigger(
    graphId: string,
    entryNodeIds: string[],
    payload: ExecutionPayload = {},
    parent?: { executionId: string; nodeId: string },
    transport?: ExecutionInstance['transport'],
  ): Promise<string> {
    this.requireGraph(graphId);
    const e: ExecutionInstance = {
      id: this.next('execution'), graphId, state: 'RUNNING',
      parentExecutionId: parent?.executionId, parentNodeId: parent?.nodeId,
      branches: new Map(), children: new Set(), entryNodeIds: [...entryNodeIds],
      initialPayload: payload, transport,
    };
    this.executions.set(e.id, e);
    if (parent) this.executions.get(parent.executionId)?.children.add(e.id);
    this.emit({ type: 'started', executionId: e.id, parentExecutionId: parent?.executionId });
    if (!entryNodeIds.length) await this.fail(e, new Error(`Graph ${graphId} has no execution entry`));
    else await Promise.all(entryNodeIds.map((id) => this.startBranch(e, this.requireGraph(graphId), id, payload)));
    this.reconcile(e);
    return e.id;
  }
  async play(id: string): Promise<string> {
    const e = this.requireExecution(id);
    if (e.state === 'RUNNING') return id;
    if (e.state !== 'PAUSED') return this.trigger(e.graphId, e.entryNodeIds, e.initialPayload);
    e.state = 'RUNNING'; e.transport?.dispatch('play');
    await Promise.all([...e.branches.values()].filter((b) => b.state === 'PAUSED').map(async (b) => {
      b.state = 'RUNNING'; await b.controller?.resume();
    }));
    await Promise.all([...e.children].map(async (childId) => {
      const child = this.executions.get(childId);
      if (child?.state === 'PAUSED') await this.play(childId);
    }));
    this.emit({ type: 'resumed', executionId: id });
    return id;
  }
  async pause(id: string): Promise<void> {
    const e = this.requireExecution(id);
    if (e.state !== 'RUNNING') return;
    e.state = 'PAUSED'; e.transport?.dispatch('pause');
    await Promise.all([...e.branches.values()].filter((b) => b.state === 'RUNNING').map(async (b) => {
      b.state = 'PAUSED'; await b.controller?.pause();
    }));
    await Promise.all([...e.children].map(async (childId) => {
      const child = this.executions.get(childId);
      if (child?.state === 'RUNNING') await this.pause(childId);
    }));
    this.emit({ type: 'paused', executionId: id });
  }
  async stop(id: string): Promise<void> {
    const e = this.requireExecution(id);
    e.transport?.dispatch('stop'); e.transport?.dispatch('reset');
    await Promise.all([...e.children].map((childId) => this.stop(childId)));
    await Promise.all([...e.branches.values()].map(async (b) => {
      await b.controller?.stop();
      if (b.state !== 'COMPLETED' && b.state !== 'FAILED') b.state = 'STOPPED';
    }));
    e.state = 'STOPPED'; this.emit({ type: 'stopped', executionId: id }); this.resolveWaiters(e);
  }
  reset(id: string): void {
    const e = this.requireExecution(id); e.state = 'IDLE';
    e.branches.forEach((b) => { b.state = 'IDLE'; b.controller = undefined; });
  }
  private async startBranch(e: ExecutionInstance, graph: ExecutionGraph, nodeId: string, payload: ExecutionPayload, parentBranchId?: string): Promise<void> {
    const node = graph.nodes.find((n) => n.id === nodeId);
    if (!node) return this.fail(e, new Error(`Unknown execution node: ${nodeId}`));
    const b: ExecutionBranch = { id: this.next('branch'), nodeId, state: 'RUNNING', parentBranchId, payload };
    e.branches.set(b.id, b);
    this.emit({ type: 'branch-started', executionId: e.id, branchId: b.id, nodeId });
    this.emit({ type: 'node-started', executionId: e.id, branchId: b.id, nodeId });
    const context: ExecutionNodeContext = { runtime: this, execution: e, branch: b, node, graph, payload, transport: e.transport };
    try {
      const result = await this.handler(node)(context);
      if (result.status === 'FAILED') return this.fail(e, result.error);
      b.controller = result.status === 'WAITING' ? result.controller : undefined;
      if (result.status === 'WAITING') {
        const waitingPayload = result.payload as ExecutionPayload | undefined;
        b.payload = waitingPayload ?? payload;
        result.completion.then((p) => {
          const nextPayload: ExecutionPayload = (p as ExecutionPayload | undefined) ?? b.payload;
          return this.finishBranch(e, graph, b, result.outputs, nextPayload);
        })
          .catch((error) => this.fail(e, error instanceof Error ? error : new Error(String(error))));
        return;
      }
      b.payload = result.payload ?? payload;
      await this.finishBranch(e, graph, b, result.outputs, b.payload);
    } catch (error) {
      await this.fail(e, error instanceof Error ? error : new Error(String(error)));
    }
  }
  private async finishBranch(e: ExecutionInstance, graph: ExecutionGraph, b: ExecutionBranch, outputs?: string[], payload = b.payload): Promise<void> {
    if (b.state === 'STOPPED' || b.state === 'FAILED') return;
    b.payload = payload; b.state = 'COMPLETED'; b.controller = undefined;
    this.emit({ type: 'node-completed', executionId: e.id, branchId: b.id, nodeId: b.nodeId });
    await Promise.all(this.nextNodes(graph, b.nodeId, b.payload, outputs).map((n) => this.startBranch(e, graph, n.nodeId, n.payload, b.id)));
    this.emit({ type: 'branch-completed', executionId: e.id, branchId: b.id, nodeId: b.nodeId });
    this.reconcile(e);
  }
  private handler(node: GraphNode): ExecutionNodeHandler {
    const nested = this.nested.get(node.type);
    if (nested) return async (context) => {
      const target = nested(context);
      if (!target) return { status: 'FAILED', error: new Error(`No nested graph target for ${node.type}:${node.id}`) };
      const transport = node.type === 'song-section' ? this.options.createSectionTransport?.(node, context) : context.transport;
      const childId = await this.trigger(target.graphId, target.entryNodeIds, target.payload ?? context.payload, { executionId: context.execution.id, nodeId: node.id }, transport);
      return {
        status: 'WAITING',
        controller: {
          pause: () => this.pause(childId),
          resume: async () => { await this.play(childId); },
          stop: () => this.stop(childId),
        },
        completion: this.waitForCompletion(childId).then((child) => {
          if (child.state !== 'COMPLETED') throw new Error(`Child execution ${child.id} ended as ${child.state}`);
          return context.payload;
        }),
      };
    };
    if (node.type === 'performance-selector' || node.type === 'song-selector' || node.type === 'section-selector') {
      return (context) => {
        const selection = this.options.selectionResolver?.(node, context.payload, context) ?? context.payload.selection ?? Number(node.data?.selection ?? 0);
        if (!Number.isInteger(selection) || selection < 0) return { status: 'FAILED', error: new Error(`Invalid Selector selection for ${node.id}`) };
        return { status: 'COMPLETED', payload: { ...context.payload, selection } };
      };
    }
    if (node.type === 'multiplexer') return () => ({ status: 'COMPLETED' });
    const registered = this.handlers.get(node.type);
    if (registered) return registered;
    return () => ({ status: 'FAILED', error: new Error(`No execution handler registered for node type: ${node.type}`) });
  }
  private nextNodes(graph: ExecutionGraph, nodeId: string, payload: ExecutionPayload, outputs?: string[]) {
    const node = graph.nodes.find((n) => n.id === nodeId);
    const edges = graph.edges.filter((e) => e.source === nodeId && e.targetSocket === 'execution-in');
    if (node?.type === 'performance-selector' || node?.type === 'song-selector' || node?.type === 'section-selector') {
      const index = payload.selection ?? 0;
      const socket = outputs?.[index] ?? edges[index]?.sourceSocket;
      return socket ? edges.filter((e) => e.sourceSocket === socket).map((e) => ({ nodeId: e.target, payload })) : [];
    }
    return edges.filter((e) => !outputs || outputs.includes(e.sourceSocket)).map((e) => ({ nodeId: e.target, payload }));
  }
  private reconcile(e: ExecutionInstance): void {
    if (e.state === 'FAILED' || e.state === 'STOPPED') return;
    if ([...e.branches.values()].some((b) => b.state === 'RUNNING' || b.state === 'PAUSED' || b.state === 'IDLE')) return;
    const failed = [...e.branches.values()].some((b) => b.state === 'FAILED');
    e.state = failed ? 'FAILED' : 'COMPLETED';
    this.emit({ type: failed ? 'failed' : 'completed', executionId: e.id, parentExecutionId: e.parentExecutionId });
    this.resolveWaiters(e);
  }
  private async fail(e: ExecutionInstance, error: Error): Promise<void> {
    if (e.state === 'FAILED' || e.state === 'STOPPED') return;
    e.state = 'FAILED';
    await Promise.all([...e.branches.values()].filter((b) => b.state === 'RUNNING' || b.state === 'PAUSED').map(async (b) => {
      await b.controller?.stop(); b.state = 'FAILED';
    }));
    this.emit({ type: 'failed', executionId: e.id, error }); this.resolveWaiters(e);
  }
  private resolveWaiters(e: ExecutionInstance): void {
    const waiters = this.waiters.get(e.id);
    if (!waiters) return;
    this.waiters.delete(e.id); waiters.forEach((resolve) => resolve(e));
  }
  private requireGraph(id: string): ExecutionGraph {
    const graph = this.graphs.get(id); if (!graph) throw new Error(`Unknown execution graph: ${id}`); return graph;
  }
  private requireExecution(id: string): ExecutionInstance {
    const e = this.executions.get(id); if (!e) throw new Error(`Unknown execution instance: ${id}`); return e;
  }
  private next(prefix: string): string { this.sequence += 1; return `${prefix}-${this.sequence}`; }
  private emit(event: ExecutionEvent): void { this.options.onEvent?.(event); }
}
export * from './executionRuntimeTriggers.js'; export * from './executionRuntimeTemporal.js';