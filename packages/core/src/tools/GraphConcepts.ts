/**
 * @file GraphConcepts.ts
 * @role component
 * @description Polymorphic generic templates for graph topology, BFS/DFS traversal, and topological sorting.
 */

export interface IGraph<TNode, TEdge = any> {
  nodes: Map<string, TNode>;
  edges: Map<string, Array<{ target: string; data?: TEdge }>>;
}

/**
 * Traverses a graph using Breadth-First Search (BFS) or Depth-First Search (DFS).
 */
export function traverseGraph<TNode, TEdge>(
  graph: IGraph<TNode, TEdge>,
  startId: string,
  mode: "bfs" | "dfs" = "bfs",
  visitor: (nodeId: string, node: TNode, depth: number) => boolean | void
): void {
  const visited = new Set<string>();
  const queueOrStack: Array<{ id: string; depth: number }> = [{ id: startId, depth: 0 }];

  while (queueOrStack.length > 0) {
    const current = mode === "bfs" ? queueOrStack.shift()! : queueOrStack.pop()!;
    if (visited.has(current.id)) continue;
    visited.add(current.id);

    const node = graph.nodes.get(current.id);
    if (!node) continue;

    const stop = visitor(current.id, node, current.depth);
    if (stop === true) break;

    const neighbors = graph.edges.get(current.id) || [];
    for (const edge of neighbors) {
      if (!visited.has(edge.target)) {
        queueOrStack.push({ id: edge.target, depth: current.depth + 1 });
      }
    }
  }
}

/**
 * Performs topological sort on a directed acyclic graph (DAG) with cycle detection.
 */
export function topologicalSort<TNode, TEdge>(
  graph: IGraph<TNode, TEdge>
): { sorted: string[]; hasCycle: boolean } {
  const inDegree = new Map<string, number>();
  for (const nodeId of graph.nodes.keys()) {
    inDegree.set(nodeId, 0);
  }

  for (const [, edges] of graph.edges) {
    for (const edge of edges) {
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    }
  }

  const queue: string[] = [];
  for (const [nodeId, deg] of inDegree) {
    if (deg === 0) queue.push(nodeId);
  }

  const sorted: string[] = [];
  while (queue.length > 0) {
    const u = queue.shift()!;
    sorted.push(u);

    const neighbors = graph.edges.get(u) || [];
    for (const edge of neighbors) {
      const newDeg = (inDegree.get(edge.target) || 0) - 1;
      inDegree.set(edge.target, newDeg);
      if (newDeg === 0) {
        queue.push(edge.target);
      }
    }
  }

  const hasCycle = sorted.length !== graph.nodes.size;
  return { sorted, hasCycle };
}
