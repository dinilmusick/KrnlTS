/**
 * @file LifecycleGraph.ts
 * @description Directed Acyclic Graph (DAG) for state and component lifecycles.
 * Enforces cycle invalidation and recursive cascade destruction.
 */

import { LifecycleScopeType, LifecycleGraphNode } from './types.js';

export class LifecycleCycleError extends Error {
  constructor(source: string, target: string) {
    super(`[SKIPO_STATE] Cyclic lifecycle dependency detected: ${source} -> ${target}`);
    this.name = 'LifecycleCycleError';
  }
}

export class LifecycleGraph {
  private nodes = new Map<string, LifecycleGraphNode>();

  registerNode(id: string, type: LifecycleScopeType): LifecycleGraphNode {
    let node = this.nodes.get(id);
    if (!node) {
      node = {
        id,
        type,
        dependencies: new Set<string>(),
        dependents: new Set<string>(),
      };
      this.nodes.set(id, node);
    }
    return node;
  }

  getNode(id: string): LifecycleGraphNode | undefined {
    return this.nodes.get(id);
  }

  hasCycle(start: string, target: string): boolean {
    const visited = new Set<string>();
    const stack: string[] = [target];

    while (stack.length > 0) {
      const current = stack.pop()!;
      if (current === start) return true;
      if (!visited.has(current)) {
        visited.add(current);
        const node = this.nodes.get(current);
        if (node) {
          for (const dep of node.dependencies) {
            stack.push(dep);
          }
        }
      }
    }
    return false;
  }

  addDependency(sourceId: string, targetId: string): void {
    if (sourceId === targetId) {
      throw new LifecycleCycleError(sourceId, targetId);
    }
    if (this.hasCycle(sourceId, targetId)) {
      throw new LifecycleCycleError(sourceId, targetId);
    }

    const sourceNode = this.registerNode(sourceId, 'STATE_DEPENDENCY');
    const targetNode = this.registerNode(targetId, 'COMPONENT');

    sourceNode.dependencies.add(targetId);
    targetNode.dependents.add(sourceId);
  }

  removeDependency(sourceId: string, targetId: string): void {
    const sourceNode = this.nodes.get(sourceId);
    const targetNode = this.nodes.get(targetId);

    if (sourceNode) sourceNode.dependencies.delete(targetId);
    if (targetNode) targetNode.dependents.delete(sourceId);
  }

  destroyCascade(rootId: string): string[] {
    const destroyed: string[] = [];
    const visited = new Set<string>();

    const dfs = (currId: string) => {
      if (visited.has(currId)) return;
      visited.add(currId);

      const node = this.nodes.get(currId);
      if (node) {
        // Collect dependents first (cascade downward)
        for (const depId of Array.from(node.dependents)) {
          dfs(depId);
        }
      }
      destroyed.push(currId);
    };

    dfs(rootId);

    // Clean up graph nodes
    for (const id of destroyed) {
      const node = this.nodes.get(id);
      if (node) {
        for (const depId of node.dependencies) {
          const depNode = this.nodes.get(depId);
          if (depNode) depNode.dependents.delete(id);
        }
      }
      this.nodes.delete(id);
    }

    return destroyed;
  }

  clear(): void {
    this.nodes.clear();
  }
}
