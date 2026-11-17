import type { FrnlCapability, FrnlContract } from './core.js';
import { DependencyGraph } from './dependencies.js';

export interface FrnlRegistration {
  readonly id: string;
  readonly version: number;
  readonly contract?: FrnlContract;
  readonly capabilities?: readonly FrnlCapability[];
  readonly value: unknown;
}

export class FrnlRegistry {
  private readonly entries = new Map<string, FrnlRegistration>();

  register(entry: FrnlRegistration): void {
    if (!entry || !entry.id || typeof entry.id !== 'string') {
      throw new TypeError('Invalid registry entry: id must be a non-empty string');
    }
    if (!Number.isInteger(entry.version) || entry.version < 1) {
      throw new TypeError(
        `Invalid registry entry '${entry.id}': version must be a positive integer, received ${entry.version}`
      );
    }

    const current = this.entries.get(entry.id);
    if (current && current.version > entry.version) {
      throw new Error(
        `Cannot register older version (${entry.version}) of '${entry.id}'. Active version is ${current.version}.`
      );
    }

    this.entries.set(entry.id, Object.freeze({ ...entry }));
  }

  has(id: string): boolean {
    return this.entries.has(id);
  }

  get(id: string): FrnlRegistration | undefined {
    return this.entries.get(id);
  }

  resolve<T = unknown>(id: string): T {
    const entry = this.entries.get(id);
    if (!entry) {
      throw new Error(`Frnl registration not found: ${id}`);
    }
    return entry.value as T;
  }

  list(): readonly FrnlRegistration[] {
    return [...this.entries.values()];
  }

  requireCapabilities(id: string, available: Iterable<string>): void {
    const entry = this.entries.get(id);
    if (!entry) {
      throw new Error(`Frnl registration not found: ${id}`);
    }

    const availableSet = new Set(available);
    const required: string[] = [];

    if (entry.contract?.capabilities) {
      required.push(...entry.contract.capabilities);
    }
    if (entry.capabilities) {
      for (const cap of entry.capabilities) {
        if (cap.requires) {
          required.push(...cap.requires);
        }
      }
    }

    for (const cap of required) {
      if (!availableSet.has(cap)) {
        throw new Error(`Missing capability '${cap}' for registration '${id}'`);
      }
    }
  }

  toDependencyGraph(): DependencyGraph {
    const graph = new DependencyGraph();
    for (const entry of this.entries.values()) {
      const requires: string[] = [];
      if (entry.contract?.capabilities) {
        requires.push(...entry.contract.capabilities);
      }
      const provides: string[] = [];
      if (entry.capabilities) {
        for (const cap of entry.capabilities) {
          if (cap.provides) {
            provides.push(...cap.provides);
          }
        }
      }
      graph.register({
        id: entry.id,
        version: entry.version,
        requires,
        provides,
      });
    }
    return graph;
  }

  clear(): void {
    this.entries.clear();
  }
}