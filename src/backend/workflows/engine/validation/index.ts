import { GraphJSON } from "../types/graph.js";

export interface ValidationError {
  nodeId?: string;
  edgeId?: string;
  message: string;
  severity: 'error' | 'warning';
}

export function validateGraph(graph: GraphJSON): ValidationError[] {
  const errors: ValidationError[] = [];
  const nodeIds = new Set(graph.nodes.map(n => n.id));

  // 1. Check for empty graph
  if (graph.nodes.length === 0) {
    errors.push({
      message: "The graph contains no nodes.",
      severity: "warning"
    });
    return errors;
  }

  // 2. Check edges validity
  for (const edge of graph.edges) {
    if (!nodeIds.has(edge.source)) {
      errors.push({
        edgeId: edge.id,
        message: `Edge connects from a non-existent source node: '${edge.source}'`,
        severity: "error"
      });
    }
    if (!nodeIds.has(edge.target)) {
      errors.push({
        edgeId: edge.id,
        message: `Edge connects to a non-existent target node: '${edge.target}'`,
        severity: "error"
      });
    }
  }

  // 3. Detect Circular Dependencies (Graph Cycles)
  const adjList: Map<string, string[]> = new Map();
  graph.nodes.forEach(n => adjList.set(n.id, []));
  graph.edges.forEach(e => {
    if (adjList.has(e.source)) {
      adjList.get(e.source)!.push(e.target);
    }
  });

  const visited: Record<string, boolean> = {};
  const recStack: Record<string, boolean> = {};

  const hasCycle = (nodeId: string): boolean => {
    visited[nodeId] = true;
    recStack[nodeId] = true;

    const neighbors = adjList.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!visited[neighbor]) {
        if (hasCycle(neighbor)) return true;
      } else if (recStack[neighbor]) {
        return true;
      }
    }

    recStack[nodeId] = false;
    return false;
  };

  for (const node of graph.nodes) {
    if (!visited[node.id]) {
      if (hasCycle(node.id)) {
        errors.push({
          message: "Circular dependency detected. Graph execution contains cycles.",
          severity: "error"
        });
        break;
      }
    }
  }

  return errors;
}
