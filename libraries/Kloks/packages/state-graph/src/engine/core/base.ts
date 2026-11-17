import type { Disposable, Logger, SkipoConfig } from './types.js';
import { shortId } from './string.js';

/**
 * SkipoBase — Abstract foundation class for all Skipo components.
 * Provides lifecycle management, logging, and unique identification.
 * All @skipo/* classes should extend this.
 */
export abstract class SkipoBase implements Disposable {
  /** Unique instance identifier */
  public readonly instanceId: string;
  /** Human-readable component name */
  public readonly name: string;
  /** Logger instance */
  protected readonly logger: Logger;
  /** Whether this component has been initialized */
  protected initialized = false;
  /** Whether this component has been disposed */
  protected disposed = false;

  constructor(config: SkipoConfig = { name: 'SkipoComponent' }) {
    this.instanceId = shortId();
    this.name = config?.name ?? 'SkipoComponent';
    this.logger = config?.logger ?? console;
  }

  /** Initialize the component. Call before use. */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.logger.log(`[${this.name}:${this.instanceId}] Initializing`);
    await this.onInitialize();
    this.initialized = true;
  }

  /** Override to add custom initialization logic */
  protected async onInitialize(): Promise<void> {}

  /** Dispose the component and release resources */
  async dispose(): Promise<void> {
    if (this.disposed) return;
    this.logger.log(`[${this.name}:${this.instanceId}] Disposing`);
    await this.onDispose();
    this.disposed = true;
  }

  /** Override to add custom cleanup logic */
  protected async onDispose(): Promise<void> {}

  /** Guard: throws if not initialized */
  protected ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error(`${this.name} has not been initialized. Call initialize() first.`);
    }
  }

  /** Guard: throws if already disposed */
  protected ensureNotDisposed(): void {
    if (this.disposed) {
      throw new Error(`${this.name} has been disposed and cannot be used.`);
    }
  }
}
