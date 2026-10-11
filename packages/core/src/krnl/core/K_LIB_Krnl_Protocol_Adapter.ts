/**
 * @file K_LIB_Krnl_Protocol_Adapter.ts
 * @description Contract for protocol adapters attached to Entities.
 *
 * In the Gross Architecture model:
 * - Adapters are declarative capabilities attached to an Entity.
 * - They become operational ONLY while that entity occupies root position.
 * - When an entity is adopted by a parent, it relinquishes root position and stops its adapters.
 * - The entity tree and its bubbling system remain the canonical capability authority.
 */

export interface KrnlCapabilityResolution {
  owner: any;
  fid: string;
}

export interface KrnlProtocolAdapter {
  /** Unique name: 'https' | 'wss' | 'udp' | custom */
  readonly name: string;

  /**
   * Start serving on behalf of the entity.
   * Entity reference provided — adapter resolves capabilities through the entity.
   */
  start(entity: any, options?: any): Promise<void>;

  /**
   * Called whenever the entity's exposed capability surface changes
   * (e.g. child added, new functionality bubbled, visibility change).
   * MUST be idempotent.
   */
  onCapabilitySurfaceChanged(entity: any): void;

  /**
   * Gracefully stops the server. Called when entity is adopted by a parent.
   */
  stop(): Promise<void>;

  /**
   * Disposes of any resources held by the adapter.
   */
  dispose?(): void;
}
