import type { GhostNodeRecord, GhostTraceRecord } from '../spatial/prediction/types.js';

export type GhostStoreListener = () => void;

export class GhostStore {
  private static instance: GhostStore | null = null;

  public isActive = false;
  public ghostNodes: GhostNodeRecord[] = [];
  public ghostTraces: GhostTraceRecord[] = [];
  public scenarioIndex = 0;
  public hoveredGhostId: string | null = null;
  public sourceNodeIds: string[] = [];

  private listeners: Set<GhostStoreListener> = new Set();

  public static getInstance(): GhostStore {
    if (!this.instance) {
      this.instance = new GhostStore();
    }
    return this.instance;
  }

  public subscribe(listener: GhostStoreListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  public setPredictions(
    nodes: GhostNodeRecord[],
    traces: GhostTraceRecord[],
    sourceNodeIds: string[]
  ): void {
    this.ghostNodes = nodes;
    this.ghostTraces = traces;
    this.sourceNodeIds = [...sourceNodeIds];
    this.isActive = nodes.length > 0;
    this.scenarioIndex = 0;
    this.hoveredGhostId = null;
    this.notify();
  }

  public cycleScenario(maxScenarios = 3): void {
    if (this.ghostNodes.length === 0) return;
    const available = new Set(this.ghostNodes.map(n => n.scenarioIndex));
    const count = Math.max(available.size, maxScenarios);
    this.scenarioIndex = (this.scenarioIndex + 1) % count;
    this.notify();
  }

  public setHoveredGhostId(id: string | null): void {
    if (this.hoveredGhostId !== id) {
      this.hoveredGhostId = id;
      this.notify();
    }
  }

  public getActiveGhostNodes(): GhostNodeRecord[] {
    return this.ghostNodes.filter(n => n.scenarioIndex === this.scenarioIndex);
  }

  public getActiveGhostTraces(): GhostTraceRecord[] {
    return this.ghostTraces.filter(t => t.scenarioIndex === this.scenarioIndex);
  }

  public clear(): void {
    this.isActive = false;
    this.ghostNodes = [];
    this.ghostTraces = [];
    this.scenarioIndex = 0;
    this.hoveredGhostId = null;
    this.sourceNodeIds = [];
    this.notify();
  }
}
