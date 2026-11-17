import { GraphJSON } from "../types/graph.js";
import { MemoryStore } from "../memory/index.js";
import { validateGraph } from "../validation/index.js";
import { planGraphExecution } from "../planner/index.js";
import { executeNode } from "../executor/index.js";
import { ExecutionQueue } from "./queue.js";
import { ExecutionContext, type GraphExecutionServices, type VerifiedLuthPrincipal } from "../executor/context.js";
import { NodeRegistry } from "../registry/index.js";

export type SchedulerEventType = 
  | 'GraphStarted' 
  | 'NodeStarted' 
  | 'NodeFinished' 
  | 'NodeFailed' 
  | 'GraphFinished' 
  | 'VariableChanged' 
  | 'ExecutionCancelled';

export interface SchedulerEvent {
  type: SchedulerEventType;
  timestamp: number;
  graphId?: string;
  nodeId?: string;
  data?: any;
}

export type SchedulerListener = (event: SchedulerEvent) => void;

export interface SchedulerExecutionOptions {
  executionId?: string;
  workspaceId?: string;
  principal?: VerifiedLuthPrincipal;
  services?: GraphExecutionServices;
  signal?: AbortSignal;
}

export class GraphScheduler {
  constructor(private readonly registry: NodeRegistry) {}
  private listeners: Set<SchedulerListener> = new Set();
  private isCancelled: boolean = false;
  private isPaused: boolean = false;
  private activeNodeId: string | null = null;
  private currentContext: ExecutionContext | null = null;
  private activeMemory: MemoryStore | null = null;

  subscribe(listener: SchedulerListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: SchedulerEvent): void {
    this.listeners.forEach(l => l(event));
  }

  cancel(): void {
    this.isCancelled = true;
    if (this.currentContext) {
      this.currentContext.cancel();
    }
    this.emit({
      type: 'ExecutionCancelled',
      timestamp: Date.now()
    });
  }

  pause(): void {
    this.isPaused = true;
  }

  resume(): void {
    this.isPaused = false;
  }

  getActiveNodeId(): string | null {
    return this.activeNodeId;
  }

  getIsCancelled(): boolean {
    return this.isCancelled;
  }

  logMessage(message: string, level: "info" | "success" | "warn" | "error" | "ai", nodeId?: string): void {
    if (this.activeMemory) {
      this.activeMemory.log(message, level, nodeId);
    }
  }

  dispose(): void { this.currentContext?.dispose(); this.currentContext = null; this.activeMemory = null; this.activeNodeId = null; }

  async run(graph: GraphJSON, initialVariables: Record<string, any> = {}, options: SchedulerExecutionOptions = {}): Promise<MemoryStore> {
    this.isCancelled = false;
    this.isPaused = false;
    this.activeNodeId = null;

    const memory = new MemoryStore(initialVariables);
    this.activeMemory = memory;
    
    // Instantiate Phase 2 ExecutionContext
    const context = new ExecutionContext(this, initialVariables, options.executionId, options.workspaceId || (graph as any).settings?.workspaceId, options.principal, options.services, options.signal);
    const abortHandler = () => this.cancel();
    options.signal?.addEventListener("abort", abortHandler, { once: true });
    if (options.signal?.aborted) this.cancel();
    this.currentContext = context;

    // Emit GraphStarted
    this.emit({
      type: 'GraphStarted',
      timestamp: Date.now(),
      data: { initialVariables }
    });

    memory.log("🚀 Starting Graph Validation...", "info");
    const validationErrors = validateGraph(graph);
    
    const errorsList = validationErrors.filter(e => e.severity === 'error');
    if (errorsList.length > 0) {
      const errorMsg = `Graph validation failed: ${errorsList[0].message}`;
      memory.log(errorMsg, "error");
      this.emit({
        type: 'GraphFinished',
        timestamp: Date.now(),
        data: { success: false, error: errorMsg }
      });
      memory.setError("__graph__", errorMsg);
      context.dispose();
      options.signal?.removeEventListener("abort", abortHandler);
      return memory;
    }

    validationErrors.forEach(warn => {
      memory.log(`[Validation Warning] ${warn.message}`, "warn");
    });

    memory.log("📋 Initializing execution queue...", "info");
    const queue = new ExecutionQueue();

    // Set up tracking states
    const nodeState: Record<string, "waiting" | "scheduled" | "executing" | "completed" | "failed"> = {};

    graph.nodes.forEach(n => {
      nodeState[n.id] = "waiting";
    });

    const hasAnyExecEdges = graph.edges.some(
      e => e.sourceHandle === "exec-out" || e.sourceHandle?.startsWith("exec-out-") || e.targetHandle === "exec-in"
    );

    const isConnectedToActiveFlow = (startNodeId: string): boolean => {
      const visited = new Set<string>();
      const searchQueue = [startNodeId];
      visited.add(startNodeId);

      while (searchQueue.length > 0) {
        const currentId = searchQueue.shift()!;
        const currentNode = graph.nodes.find(n => n.id === currentId);
        if (!currentNode) continue;

        const nodeType = String(currentNode.type || "");
        if (
          !nodeType.startsWith("math/") &&
          !nodeType.startsWith("string/") &&
          !nodeType.startsWith("logic/") &&
          !nodeType.startsWith("collections/") &&
          !nodeType.startsWith("parsing/") &&
          !nodeType.startsWith("process/") &&
          nodeType !== "core/constant" &&
          nodeType !== "core/primitive" &&
          nodeType !== "variables/create" &&
          nodeType !== "variables/get" &&
          nodeType !== "inspectorNode"
        ) {
          return true;
        }

        const connectedEdges = graph.edges.filter(
          e => e.source === currentId || e.target === currentId
        );

        for (const edge of connectedEdges) {
          const neighborId = edge.source === currentId ? edge.target : edge.source;
          if (!visited.has(neighborId)) {
            visited.add(neighborId);
            searchQueue.push(neighborId);
          }
        }
      }

      return false;
    };

    const shouldSkipExecution = (nodeId: string): boolean => {
      const node = graph.nodes.find(n => n.id === nodeId);
      if (!node) return true;

      const nodeType = String(node.type || "");
      const isPureNode = 
        nodeType.startsWith("math/") ||
        nodeType.startsWith("string/") ||
        nodeType.startsWith("logic/") ||
        nodeType.startsWith("collections/") ||
        nodeType.startsWith("parsing/") ||
        nodeType.startsWith("process/") ||
        nodeType === "core/constant" || 
        nodeType === "core/primitive" ||
        nodeType === "variables/create" ||
        nodeType === "variables/get";

      if (isPureNode) {
        return hasAnyExecEdges && !isConnectedToActiveFlow(nodeId);
      }

      return false;
    };

    const isActiveProcessingNode = (nodeType: string): boolean => {
      if (
        nodeType === "core/constant" ||
        nodeType === "core/primitive" ||
        nodeType === "variables/create" ||
        nodeType === "variables/get" ||
        nodeType === "core/exec-start" ||
        nodeType === "inspectorNode" ||
        nodeType.startsWith("math/") ||
        nodeType.startsWith("string/") ||
        (nodeType.startsWith("logic/") && nodeType !== "logic/switch") ||
        nodeType.startsWith("collections/") ||
        nodeType.startsWith("parsing/") ||
        nodeType.startsWith("process/")
      ) {
        return false;
      }
      return true;
    };

    const getReadyNodes = () => {
      const ready: string[] = [];
      graph.nodes.forEach(n => {
        if (nodeState[n.id] !== "waiting") return;
        if (n.type === "inspectorNode") return; // Passive UI inspector nodes never execute in the engine!
        if (shouldSkipExecution(n.id)) {
          return;
        }

        // 1. Check data dependencies (inputs are from data edges)
        const incomingData = graph.edges.filter(
          e => e.target === n.id && 
            e.sourceHandle !== "exec-out" && 
            !e.sourceHandle?.startsWith("exec-out-") && 
            e.targetHandle !== "exec-in"
        );
        const dataDepsSatisfied = incomingData.every(e => nodeState[e.source] === "completed");
        if (!dataDepsSatisfied) {
          return;
        }

        // 2. Check execution dependencies for any node that has incoming execution flow connections, or if it is an active processing node with no execution connections when flow is active
        if (hasAnyExecEdges) {
          const incomingExec = graph.edges.filter(
            e => e.target === n.id && (
              e.sourceHandle === "exec-out" || 
              e.sourceHandle?.startsWith("exec-out-") || 
              e.targetHandle === "exec-in"
            )
          );
          
          if (incomingExec.length > 0) {
            const execDepsSatisfied = incomingExec.some(e => {
              if (nodeState[e.source] !== "completed") {
                return false;
              }
              const sourceNode = graph.nodes.find(sn => sn.id === e.source);
              if (sourceNode && sourceNode.type === "logic/switch") {
                const activeIndex = memory.getNodeOutput(e.source, "activeIndex");
                if (e.sourceHandle && e.sourceHandle.startsWith("exec-out-")) {
                  const handleIdxStr = e.sourceHandle.replace("exec-out-", "");
                  const handleIdx = Number(handleIdxStr);
                  return activeIndex === handleIdx;
                }
              }
              if (sourceNode && sourceNode.type === "logic/loop") {
                if (e.sourceHandle === "exec-out-body") {
                  // The loop body is run internally by the loop node execution, not by the main scheduler queue
                  return false;
                }
                if (e.sourceHandle === "exec-out-completed") {
                  return nodeState[e.source] === "completed";
                }
              }
              return true;
            });
            if (!execDepsSatisfied) {
              return;
            }
          } else if (isActiveProcessingNode(n.type)) {
            // An active processing node with no execution connections in a graph with active flow must be skipped
            return;
          }
        }

        ready.push(n.id);
      });
      return ready;
    };

    // Enqueue initial nodes
    getReadyNodes().forEach(nodeId => {
      queue.enqueue(nodeId);
      nodeState[nodeId] = "scheduled";
    });

    const errorPolicy = (graph as any).settings?.errorPolicy || "stop";

    const cascadeSkip = (failedId: string) => {
      const skipQueue = [failedId];
      while (skipQueue.length > 0) {
        const currentId = skipQueue.shift()!;
        const dependents = graph.edges
          .filter(e => e.source === currentId)
          .map(e => e.target);
        
        dependents.forEach(depId => {
          if (nodeState[depId] === "waiting" || nodeState[depId] === "scheduled") {
            nodeState[depId] = "failed";
            memory.log(`[Skipped] Node '${depId}' was skipped because its dependency '${currentId}' failed.`, "warn", depId);
            skipQueue.push(depId);
          }
        });
      }
    };

    // Main queue execution loop (FIFO, Non-recursive)
    while (!queue.isEmpty()) {
      if (this.isCancelled) {
        memory.log("🛑 Execution cancelled by user scheduler controls.", "warn");
        break;
      }

      // Handle pause polling loop
      while (this.isPaused && !this.isCancelled) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      const nodeId = queue.dequeue();
      if (!nodeId) continue;

      const node = graph.nodes.find(n => n.id === nodeId);
      if (!node) continue;

      this.activeNodeId = nodeId;
      nodeState[nodeId] = "executing";

      this.emit({
        type: 'NodeStarted',
        nodeId,
        timestamp: Date.now()
      });

      // Maintain visual pace delay so UI flow is clear and readable
      const paceDelay = (graph as any).settings?.executionDelayMs ?? 800;
      await new Promise(resolve => setTimeout(resolve, paceDelay));

      if (node.type === "variables/create") {
        nodeState[nodeId] = "completed";
        this.emit({
          type: 'NodeFinished',
          nodeId,
          timestamp: Date.now(),
          data: { outputs: {} }
        });

        // Trigger execution of newly ready nodes
        getReadyNodes().forEach(nextId => {
          queue.enqueue(nextId);
          nodeState[nextId] = "scheduled";
        });
        continue;
      }

      if (node.type === "logic/loop") {
        try {
          // 1. Execute the loop node once to get the items
          const outputs = await executeNode(node, graph, memory, context, this.registry);
          const items = outputs.items || [];
          const itemsArr = Array.isArray(items) ? items : [];

          // 2. Find the loop body start node
          const bodyEdge = graph.edges.find(e => e.source === nodeId && e.sourceHandle === "exec-out-body");
          const bodyStartNodeId = bodyEdge ? bodyEdge.target : null;

          if (bodyStartNodeId) {
            // Find all loop body nodes (both exec and data downstream)
            const bodyNodesSet = new Set<string>();
            const traverseQueue = [bodyStartNodeId];
            bodyNodesSet.add(bodyStartNodeId);

            while (traverseQueue.length > 0) {
              const currentId = traverseQueue.shift()!;
              const nextEdges = graph.edges.filter(e => e.source === currentId);
              nextEdges.forEach(e => {
                if (!bodyNodesSet.has(e.target) && e.target !== nodeId) {
                  bodyNodesSet.add(e.target);
                  traverseQueue.push(e.target);
                }
              });
            }

            const bodyNodes = Array.from(bodyNodesSet);
            memory.log(`[Loop Started] Iterating over ${itemsArr.length} items. Body nodes count: ${bodyNodes.length}`, "info", nodeId);

            // 3. For each item, update outputs and run the loop body sub-graph
            for (let i = 0; i < itemsArr.length; i++) {
              if (this.isCancelled) break;

              const currentItem = itemsArr[i];
              memory.log(`[Loop Iteration] Index ${i}/${itemsArr.length - 1}: ${typeof currentItem === 'object' ? JSON.stringify(currentItem) : String(currentItem)}`, "info", nodeId);

              // Update the loop node's outputs in memory for this iteration
              memory.setNodeOutputs(nodeId, {
                items: itemsArr,
                length: itemsArr.length,
                item: currentItem,
                index: i
              });

              // Reset states of all loop body nodes
              bodyNodes.forEach(id => {
                nodeState[id] = "waiting";
              });

              const bodyQueue = new ExecutionQueue();

              const getReadyBodyNodes = (): string[] => {
                const ready: string[] = [];
                bodyNodes.forEach(id => {
                  if (nodeState[id] !== "waiting") return;
                  const n = graph.nodes.find(node => node.id === id);
                  if (!n) return;

                  // Data dependencies
                  const incomingData = graph.edges.filter(
                    e => e.target === id && 
                      e.sourceHandle !== "exec-out" && 
                      !e.sourceHandle?.startsWith("exec-out-") && 
                      e.targetHandle !== "exec-in"
                  );
                  const dataDepsSatisfied = incomingData.every(e => 
                    nodeState[e.source] === "completed" || 
                    e.source === nodeId ||
                    !bodyNodes.includes(e.source)
                  );
                  if (!dataDepsSatisfied) return;

                  // Execution dependencies
                  const incomingExec = graph.edges.filter(
                    e => e.target === id && (
                      e.sourceHandle === "exec-out" || 
                      e.sourceHandle?.startsWith("exec-out-") || 
                      e.targetHandle === "exec-in"
                    )
                  );
                  if (incomingExec.length > 0) {
                    const execDepsSatisfied = incomingExec.some(e => {
                      if (e.source === nodeId) {
                        return e.sourceHandle === "exec-out-body";
                      }
                      return nodeState[e.source] === "completed";
                    });
                    if (!execDepsSatisfied) return;
                  }

                  ready.push(id);
                });
                return ready;
              };

              // Enqueue initial nodes for this iteration
              getReadyBodyNodes().forEach(id => {
                bodyQueue.enqueue(id);
                nodeState[id] = "scheduled";
              });

              while (!bodyQueue.isEmpty()) {
                if (this.isCancelled) break;
                while (this.isPaused && !this.isCancelled) {
                  await new Promise(resolve => setTimeout(resolve, 200));
                }

                const bodyNodeId = bodyQueue.dequeue();
                if (!bodyNodeId) continue;

                const bNode = graph.nodes.find(n => n.id === bodyNodeId);
                if (!bNode) continue;

                this.activeNodeId = bodyNodeId;
                nodeState[bodyNodeId] = "executing";

                this.emit({
                  type: 'NodeStarted',
                  nodeId: bodyNodeId,
                  timestamp: Date.now()
                });

                const paceDelay = (graph as any).settings?.executionDelayMs ?? 800;
                await new Promise(resolve => setTimeout(resolve, paceDelay));

                try {
                  await executeNode(bNode, graph, memory, context, this.registry);
                  nodeState[bodyNodeId] = "completed";
                  this.emit({
                    type: 'NodeFinished',
                    nodeId: bodyNodeId,
                    timestamp: Date.now(),
                    data: { outputs: memory.getAllOutputs()[bodyNodeId] }
                  });

                  getReadyBodyNodes().forEach(nextId => {
                    bodyQueue.enqueue(nextId);
                    nodeState[nextId] = "scheduled";
                  });
                } catch (err: any) {
                  nodeState[bodyNodeId] = "failed";
                  this.emit({
                    type: 'NodeFailed',
                    nodeId: bodyNodeId,
                    timestamp: Date.now(),
                    data: { error: err.message || "Loop iteration execution crash" }
                  });
                  throw err;
                }
              }
            }
          }

          // 4. Mark loop node as completed in the main scheduler context and trigger the Completed path
          nodeState[nodeId] = "completed";
          
          // Ensure loop node has its final completed outputs
          memory.setNodeOutputs(nodeId, {
            items: itemsArr,
            length: itemsArr.length,
            item: itemsArr.length > 0 ? itemsArr[itemsArr.length - 1] : null,
            index: itemsArr.length > 0 ? itemsArr.length - 1 : -1
          });

          this.emit({
            type: 'NodeFinished',
            nodeId,
            timestamp: Date.now(),
            data: { outputs: memory.getAllOutputs()[nodeId] }
          });

          // Trigger execution of newly ready nodes (this will transition to the Completed execution path)
          getReadyNodes().forEach(nextId => {
            queue.enqueue(nextId);
            nodeState[nextId] = "scheduled";
          });

          continue;

        } catch (err: any) {
          memory.setError(nodeId, err instanceof Error ? err.message : String(err));
          nodeState[nodeId] = "failed";
          this.emit({
            type: 'NodeFailed',
            nodeId,
            timestamp: Date.now(),
            data: { error: err.message || "Loop execution crash" }
          });
          throw err;
        }
      }

      try {
        await executeNode(node, graph, memory, context, this.registry);
        
        nodeState[nodeId] = "completed";
        this.emit({
          type: 'NodeFinished',
          nodeId,
          timestamp: Date.now(),
          data: { outputs: memory.getAllOutputs()[nodeId] }
        });

        // Trigger execution of newly ready nodes
        getReadyNodes().forEach(nextId => {
          queue.enqueue(nextId);
          nodeState[nextId] = "scheduled";
        });

      } catch (err: any) {
        memory.setError(nodeId, err instanceof Error ? err.message : String(err));
        nodeState[nodeId] = "failed";
        this.emit({
          type: 'NodeFailed',
          nodeId,
          timestamp: Date.now(),
          data: { error: err.message || "Execution crash" }
        });

        if (errorPolicy === "stop" || errorPolicy === "Stop Graph") {
          // Stop executing the rest of the graph immediately
          memory.log(`[Fatal] Halting graph execution due to error in node '${nodeId}' under 'Stop Graph' policy.`, "error");
          queue.clear();
          this.emit({
            type: 'GraphFinished',
            timestamp: Date.now(),
            data: { success: false, error: `Execution halted due to node '${nodeId}' failure.` }
          });
          context.dispose();
          options.signal?.removeEventListener("abort", abortHandler);
          return memory;
        } else {
          // Continue policy: continue executing remaining independent branches
          memory.log(`[Warning] Node '${nodeId}' failed. Continuing remaining independent branches.`, "warn");
          cascadeSkip(nodeId);
          
          // Trigger execution of newly ready nodes
          getReadyNodes().forEach(nextId => {
            queue.enqueue(nextId);
            nodeState[nextId] = "scheduled";
          });
        }
      }
    }

    // Cleanup runtime objects of execution context
    context.dispose();
    options.signal?.removeEventListener("abort", abortHandler);

    this.activeNodeId = null;
    this.emit({
      type: 'GraphFinished',
      timestamp: Date.now(),
      data: { success: !this.isCancelled && context.errorCollector.getErrors().length === 0 }
    });

    memory.log("🏁 Graph execution completed.", "success");
    return memory;
  }
}
export { validateGraph, planGraphExecution };
