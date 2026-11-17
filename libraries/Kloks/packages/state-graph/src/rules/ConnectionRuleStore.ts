import type { BaseHandle, HandleCategory, HandleDirection, HandleDefinition } from '../domain/BaseHandle.js';
import type { NodeDefinition } from '../domain/BaseNode.js';
import { CompatibilityMatrix, type CompatibilityRule, type CompatibilityResolution } from './CompatibilityMatrix.js';
import { HandleTypeRegistry, type HandleTypeDefinition } from './HandleTypeRegistry.js';
import { WireTypeRegistry, type WireTypeDefinition } from './WireTypeRegistry.js';
import { initializeDefaultGraphRules } from './DefaultRules.js';

export interface HandleDescriptor {
  dataType?: string;
  direction?: HandleDirection | 'input' | 'output';
  handleCategory?: HandleCategory;
}

/**
 * ConnectionRuleStore — Central authoritative store for:
 * 1. Handle types
 * 2. Wire types
 * 3. Node types & schemas
 * 4. Inter-handle compatibility and connection rules
 */
export class ConnectionRuleStore {
  private static nodeTypes: Map<string, NodeDefinition> = new Map();
  private static listeners: Set<() => void> = new Set();
  private static initialized = false;

  public static initializeDefaults(): void {
    initializeDefaultGraphRules();
    this.initialized = true;
    this.notify();
  }

  public static isInitialized(): boolean {
    return this.initialized;
  }

  public static subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private static notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  // ---------------------------------------------------------------------------
  // Node Types
  // ---------------------------------------------------------------------------
  public static registerNodeType(def: NodeDefinition): void {
    this.nodeTypes.set(def.type, def);
    this.notify();
  }

  public static registerNodeTypes(defs: NodeDefinition[]): void {
    for (const def of defs) {
      this.nodeTypes.set(def.type, def);
    }
    this.notify();
  }

  public static getNodeType(type: string): NodeDefinition | undefined {
    return this.nodeTypes.get(type);
  }

  public static listNodeTypes(): NodeDefinition[] {
    return Array.from(this.nodeTypes.values());
  }

  public static hasNodeType(type: string): boolean {
    return this.nodeTypes.has(type);
  }

  // ---------------------------------------------------------------------------
  // Handle Types
  // ---------------------------------------------------------------------------
  public static registerHandleType(def: HandleTypeDefinition): void {
    HandleTypeRegistry.register(def);
    this.notify();
  }

  public static getHandleType(dataType: string): HandleTypeDefinition | undefined {
    return HandleTypeRegistry.get(dataType);
  }

  public static listHandleTypes(): HandleTypeDefinition[] {
    return HandleTypeRegistry.list();
  }

  public static hasHandleType(dataType: string): boolean {
    return HandleTypeRegistry.has(dataType);
  }

  // ---------------------------------------------------------------------------
  // Wire Types
  // ---------------------------------------------------------------------------
  public static registerWireType(def: WireTypeDefinition): void {
    WireTypeRegistry.register(def);
    this.notify();
  }

  public static getWireType(wireType: string): WireTypeDefinition | undefined {
    return WireTypeRegistry.get(wireType);
  }

  public static listWireTypes(): WireTypeDefinition[] {
    return WireTypeRegistry.list();
  }

  // ---------------------------------------------------------------------------
  // Compatibility & Rules
  // ---------------------------------------------------------------------------
  public static registerRule(rule: CompatibilityRule): void {
    CompatibilityMatrix.registerRule(rule);
    this.notify();
  }

  public static resolve(
    sourceHandle: Pick<BaseHandle, 'handleCategory' | 'dataType' | 'direction'>,
    targetHandle: Pick<BaseHandle, 'handleCategory' | 'dataType' | 'direction'>
  ): CompatibilityResolution {
    return CompatibilityMatrix.resolve(sourceHandle, targetHandle);
  }

  public static canConnect(
    sourceHandle: Pick<BaseHandle, 'handleCategory' | 'dataType' | 'direction'>,
    targetHandle: Pick<BaseHandle, 'handleCategory' | 'dataType' | 'direction'>
  ): boolean {
    return CompatibilityMatrix.resolve(sourceHandle, targetHandle).allowed;
  }

  /**
   * Returns all node definitions that have at least one socket compatible with the dragged handle.
   * If source handle is OUTPUT, checks candidate node INPUT sockets.
   * If source handle is INPUT, checks candidate node OUTPUT sockets.
   */
  public static getCompatibleNodeTypes(
    sourceHandle: HandleDescriptor,
    candidateNodes?: NodeDefinition[]
  ): NodeDefinition[] {
    const nodes = candidateNodes && candidateNodes.length > 0 ? candidateNodes : this.listNodeTypes();
    const sDataType = (sourceHandle.dataType || 'ANY').toUpperCase();
    const isSourceOutput =
      sourceHandle.direction === 'OUTPUT' || sourceHandle.direction === 'output';
    const sourceCategory: HandleCategory = sourceHandle.handleCategory ?? 'DATA';

    return nodes.filter(node => {
      const targetHandles = isSourceOutput ? node.inputs : node.outputs;
      if (!targetHandles || targetHandles.length === 0) {
        // Nodes without specified handles accept ANY if dataType is ANY or wildcard
        return sDataType === 'ANY' || sDataType === '*';
      }

      return targetHandles.some(targetH => {
        const tCat = targetH.category || 'DATA';
        const tDataType = (targetH.dataType || 'ANY').toUpperCase();

        const resolution = isSourceOutput
          ? CompatibilityMatrix.resolve(
              { handleCategory: sourceCategory, dataType: sDataType, direction: 'OUTPUT' },
              { handleCategory: tCat, dataType: tDataType, direction: 'INPUT' }
            )
          : CompatibilityMatrix.resolve(
              { handleCategory: tCat, dataType: tDataType, direction: 'OUTPUT' },
              { handleCategory: sourceCategory, dataType: sDataType, direction: 'INPUT' }
            );

        return resolution.allowed;
      });
    });
  }

  /**
   * Find compatible sockets on a given target node for a dragged source handle.
   */
  public static findCompatibleSockets(
    sourceHandle: HandleDescriptor,
    targetNode: NodeDefinition
  ): HandleDefinition[] {
    const sDataType = (sourceHandle.dataType || 'ANY').toUpperCase();
    const isSourceOutput =
      sourceHandle.direction === 'OUTPUT' || sourceHandle.direction === 'output';
    const sourceCategory: HandleCategory = sourceHandle.handleCategory ?? 'DATA';
    const targetHandles = isSourceOutput ? targetNode.inputs : targetNode.outputs;

    if (!targetHandles) return [];

    return targetHandles.filter(targetH => {
      const tCat = targetH.category || 'DATA';
      const tDataType = (targetH.dataType || 'ANY').toUpperCase();

      const resolution = isSourceOutput
        ? CompatibilityMatrix.resolve(
            { handleCategory: sourceCategory, dataType: sDataType, direction: 'OUTPUT' },
            { handleCategory: tCat, dataType: tDataType, direction: 'INPUT' }
          )
        : CompatibilityMatrix.resolve(
            { handleCategory: tCat, dataType: tDataType, direction: 'OUTPUT' },
            { handleCategory: sourceCategory, dataType: sDataType, direction: 'INPUT' }
          );

      return resolution.allowed;
    });
  }

  public static clear(): void {
    this.nodeTypes.clear();
    HandleTypeRegistry.clear();
    WireTypeRegistry.clear();
    CompatibilityMatrix.clear();
    this.initialized = false;
    this.notify();
  }
}
