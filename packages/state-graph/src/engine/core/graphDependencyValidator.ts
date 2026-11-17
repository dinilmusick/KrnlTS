/**
 * @file graphDependencyValidator.ts
 * @description Directed Acyclic Graph (DAG) validator for Graph Package imports.
 * Detects self-imports and transitive circular import chains before committing dependencies.
 */

export interface GraphImportNode {
  id: string;
  importedGraphIds: string[];
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  cycleChain?: string[];
}

/**
 * Validates whether adding an import from targetGraphId -> candidateImportId
 * violates the acyclic invariant.
 *
 * @param existingGraphs Map of all graph packages and their existing import lists
 * @param targetGraphId The graph that wishes to import candidateImportId
 * @param candidateImportId The graph being imported
 */
export function validateGraphImport(
  existingGraphs: Record<string, { id: string; name?: string; importedGraphIds?: string[] }>,
  targetGraphId: string,
  candidateImportId: string
): ValidationResult {
  // 1. Direct Self-Import Check
  if (targetGraphId === candidateImportId) {
    return {
      valid: false,
      error: `Circular dependency: A graph package cannot import itself ('${targetGraphId}').`,
      cycleChain: [targetGraphId, targetGraphId],
    };
  }

  // 2. Duplicate Import Check
  const target = existingGraphs[targetGraphId];
  if (target?.importedGraphIds?.includes(candidateImportId)) {
    return {
      valid: false,
      error: `Graph '${target.name || targetGraphId}' already imports '${candidateImportId}'.`,
    };
  }

  // 3. Build Adjacency Graph with the proposed edge added
  const adj = new Map<string, string[]>();

  // Populate all existing edges
  for (const [id, graph] of Object.entries(existingGraphs)) {
    const list = Array.isArray(graph.importedGraphIds) ? [...graph.importedGraphIds] : [];
    adj.set(id, list);
  }

  // Ensure target and candidate entries exist in adjacency map
  if (!adj.has(targetGraphId)) adj.set(targetGraphId, []);
  if (!adj.has(candidateImportId)) adj.set(candidateImportId, []);

  // Add the proposed new edge: targetGraphId -> candidateImportId
  adj.get(targetGraphId)!.push(candidateImportId);

  // 4. Run Cycle Detection starting from candidateImportId to see if it can reach targetGraphId
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const currentPath: string[] = [];

  function detectCycle(current: string): string[] | null {
    visited.add(current);
    recursionStack.add(current);
    currentPath.push(current);

    const neighbors = adj.get(current) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        const cycle = detectCycle(neighbor);
        if (cycle) return cycle;
      } else if (recursionStack.has(neighbor)) {
        // Cycle found
        const cycleStartIndex = currentPath.indexOf(neighbor);
        const cyclePath = [...currentPath.slice(cycleStartIndex), neighbor];
        return cyclePath;
      }
    }

    currentPath.pop();
    recursionStack.delete(current);
    return null;
  }

  // Check cycles across all components in the graph
  for (const node of adj.keys()) {
    if (!visited.has(node)) {
      currentPath.length = 0;
      const cycle = detectCycle(node);
      if (cycle) {
        const names = cycle.map((id) => existingGraphs[id]?.name || id);
        return {
          valid: false,
          error: `Circular dependency detected: ${names.join(' ➔ ')}`,
          cycleChain: cycle,
        };
      }
    }
  }

  return { valid: true };
}

/**
 * Returns the full topological sort order of dependencies for a given graph.
 */
export function getTopologicalDependencyOrder(
  existingGraphs: Record<string, { id: string; importedGraphIds?: string[] }>,
  rootGraphId: string
): string[] {
  const result: string[] = [];
  const visited = new Set<string>();

  function dfs(currentId: string) {
    if (visited.has(currentId)) return;
    visited.add(currentId);

    const graph = existingGraphs[currentId];
    if (graph?.importedGraphIds) {
      for (const impId of graph.importedGraphIds) {
        dfs(impId);
      }
    }
    result.push(currentId);
  }

  dfs(rootGraphId);
  return result;
}
