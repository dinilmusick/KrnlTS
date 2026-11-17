// ══════════════════════════════════════════════════════════════════════════════════════════
// 1. IMPORTS & EXTERNAL DEPENDENCIES
// ══════════════════════════════════════════════════════════════════════════════════════════

export type GraphAssetType = 'node' | 'wire' | 'socket' | 'ui' | 'panel' | 'effect' | 'module';
export type QwnsrAssetType = GraphAssetType;

export interface GraphMetadata {
  description?: string;
  author?: string;
  version?: string;
  tags?: string[];
  type?: string;
  signalType?: any;
  customData?: Record<string, any>;
  [key: string]: any;
}

export type GraphEntityMetadata = GraphMetadata;
export type QwnsrMetadata = GraphMetadata;

export interface GraphTransform {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}
export type QwnsrTransform = GraphTransform;

export type GraphEventListener = (payload: any) => void;
export type QwnsrEventListener = GraphEventListener;

/**
 * ══════════════════════════════════════════════════════════════════════════════════════════
 * 2. GraphEntityParent: Core Parent of All Application Assets
 * ══════════════════════════════════════════════════════════════════════════════════════════
 * Abstract base providing unified identity, lifecycle, event bus, metadata,
 * coordinate transforms, and serialization across Nodes, Wires, Sockets, and UI.
 */
export abstract class GraphEntityParent {
  public readonly id: string;
  public name: string;
  public readonly assetType: GraphAssetType;
  public isActive: boolean;
  public createdAt: number;
  public updatedAt: number;
  public metadata: GraphMetadata;
  protected eventListeners: Map<string, Set<GraphEventListener>>;


  constructor(id: string, name: string, assetType: QwnsrAssetType, metadata: QwnsrMetadata = {}) {
    this.id = id;
    this.name = name;
    this.assetType = assetType;
    this.isActive = true;
    this.createdAt = Date.now();
    this.updatedAt = Date.now();
    this.metadata = { ...metadata };
    this.eventListeners = new Map();
  }

  // ── Lifecycle Hooks ──
  public abstract initialize(): void;
  public abstract dispose(): void;

  // ── Event Bus ──
  public on(event: string, listener: QwnsrEventListener): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
    return () => this.off(event, listener);
  }

  public off(event: string, listener: QwnsrEventListener): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.eventListeners.delete(event);
      }
    }
  }

  public emit(event: string, payload?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(payload);
        } catch (err) {
          console.error(`[GraphEntityParent:${this.id}] Error in event handler for '${event}':`, err);
        }
      });
    }
  }

  // ── State Mutators ──
  public setActive(active: boolean): void {
    if (this.isActive !== active) {
      this.isActive = active;
      this.updatedAt = Date.now();
      this.emit('active_changed', active);
    }
  }

  public setName(name: string): void {
    this.name = name;
    this.updatedAt = Date.now();
    this.emit('name_changed', name);
  }

  public setMetadata(metadata: Partial<QwnsrMetadata>): void {
    this.metadata = { ...this.metadata, ...metadata };
    this.updatedAt = Date.now();
    this.emit('metadata_changed', this.metadata);
  }

  // ── Serialization Contract ──
  public abstract toJSON(): Record<string, any>;
}
