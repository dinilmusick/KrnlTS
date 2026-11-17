import type { FrnlCapability } from './core.js';

export interface DependencyNode {
  readonly id: string;
  readonly version?: number;
  readonly requires?: readonly string[];
  readonly provides?: readonly string[];
}

export class DependencyGraph {
  private readonly nodes = new Map<string, DependencyNode>();
  private readonly providers = new Map<string, Set<string>>(); // capability -> set of nodeIds

  register(node: DependencyNode): void {
    if (!node || !node.id || typeof node.id !== 'string') {
      throw new TypeError('Invalid dependency node: id must be a non-empty string');
    }
    if (this.nodes.has(node.id)) {
      throw new Error(`Duplicate dependency node: ${node.id}`);
    }

    const frozen = Object.freeze({ ...node });
    this.nodes.set(node.id, frozen);

    for (const prov of node.provides ?? []) {
      if (!this.providers.has(prov)) {
        this.providers.set(prov, new Set());
      }
      this.providers.get(prov)!.add(node.id);
    }
  }

  registerCapability(capability: FrnlCapability): void {
    this.register({
      id: capability.id,
      version: capability.version,
      requires: capability.requires,
      provides: capability.provides,
    });
  }

  get(id: string): DependencyNode | undefined {
    return this.nodes.get(id);
  }

  list(): readonly DependencyNode[] {
    return [...this.nodes.values()];
  }

  resolveDependencyNodeId(dependencyName: string): string | undefined {
    if (this.nodes.has(dependencyName)) {
      return dependencyName;
    }
    const provSet = this.providers.get(dependencyName);
    if (provSet && provSet.size > 0) {
      return [...provSet][0];
    }
    return undefined;
  }

  validate(): string[] {
    const errors: string[] = [];
    for (const node of this.nodes.values()) {
      for (const req of node.requires ?? []) {
        const resolvedId = this.resolveDependencyNodeId(req);
        if (!resolvedId) {
          errors.push(`${node.id} requires missing dependency ${req}`);
        }
      }
    }
    return errors;
  }

  topologicalOrder(): string[] {
    const visiting = new Set<string>();
    const visited = new Set<string>();
    const result: string[] = [];

    const visit = (id: string, path: string[] = []) => {
      if (visiting.has(id)) {
        const cycle = [...path, id].join(' -> ');
        throw new Error(`Dependency cycle detected at ${id}: ${cycle}`);
      }
      if (visited.has(id)) {
        return;
      }

      visiting.add(id);
      const node = this.nodes.get(id);
      for (const req of node?.requires ?? []) {
        const resolvedId = this.resolveDependencyNodeId(req);
        if (resolvedId && this.nodes.has(resolvedId)) {
          visit(resolvedId, [...path, id]);
        }
      }
      visiting.delete(id);
      visited.add(id);
      result.push(id);
    };

    for (const id of this.nodes.keys()) {
      visit(id);
    }

    return result;
  }

  clear(): void {
    this.nodes.clear();
    this.providers.clear();
  }

  static fromCapabilities(capabilities: readonly FrnlCapability[]): DependencyGraph {
    const graph = new DependencyGraph();
    for (const cap of capabilities) {
      graph.registerCapability(cap);
    }
    return graph;
  }
}