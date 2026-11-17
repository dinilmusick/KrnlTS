import { GraphJSON } from "../types/graph.js";

export interface ExecutionPlan {
  order: string[]; // Ordered list of node IDs to execute
  dependencies: Record<string, string[]>; // nodeId -> list of nodeIds it directly depends on
}

export function planGraphExecution(graph: GraphJSON): ExecutionPlan {
  const nodeIds = graph.nodes.map(n => n.id);
  const dependencies: Record<string, string[]> = {};
  nodeIds.forEach(id => {
    dependencies[id] = [];
  });

  // Build incoming dependencies: target depends on source
  graph.edges.forEach(edge => {
    if (dependencies[edge.target] && !dependencies[edge.target].includes(edge.source)) {
      dependencies[edge.target].push(edge.source);
    }
  });

  // Topological Sort (Kahn's Algorithm)
  const inDegree: Record<string, number> = {};
  const adjList: Record<string, string[]> = {};

  nodeIds.forEach(id => {
    inDegree[id] = 0;
    adjList[id] = [];
  });

  graph.edges.forEach(edge => {
    const src = edge.source;
    const tgt = edge.target;
    if (adjList[src] && inDegree[tgt] !== undefined) {
      adjList[src].push(tgt);
      inDegree[tgt]++;
    }
  });

  const queue: string[] = [];
  nodeIds.forEach(id => {
    if (inDegree[id] === 0) {
      queue.push(id);
    }
  });

  const order: string[] = [];
  while (queue.length > 0) {
    const curr = queue.shift()!;
    order.push(curr);

    const neighbors = adjList[curr] || [];
    neighbors.forEach(neighbor => {
      inDegree[neighbor]--;
      if (inDegree[neighbor] === 0) {
        queue.push(neighbor);
      }
    });
  }

  // Handle remaining nodes in case of a cyclic graph (should be caught by validation but let's be safe)
  nodeIds.forEach(id => {
    if (!order.includes(id)) {
      order.push(id);
    }
  });

  return {
    order,
    dependencies
  };
}
