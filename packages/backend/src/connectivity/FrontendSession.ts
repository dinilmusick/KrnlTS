/**
 * @file FrontendSession.ts
 * @description Frontend session container tracking credentials, capabilities, callbacks, and sequence state.
 */

import { CallbackRegistry } from './CallbackRegistry.js';
import { SequenceTracker } from './SequenceTracker.js';

export interface FrontendSessionOptions {
  sessionId?: string;
  credentials?: Record<string, string>;
  capabilities?: string[];
  callbackRegistry?: CallbackRegistry;
  sequenceTracker?: SequenceTracker;
}

export class FrontendSession {
  public readonly sessionId: string;
  private credentials: Record<string, string>;
  private capabilities: Set<string>;
  public readonly callbackRegistry: CallbackRegistry;
  public readonly sequenceTracker: SequenceTracker;
  private subscriptions: Set<() => void> = new Set();

  constructor(options: FrontendSessionOptions = {}) {
    this.sessionId = options.sessionId || `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.credentials = { ...(options.credentials || {}) };
    this.capabilities = new Set(options.capabilities || []);
    this.callbackRegistry = options.callbackRegistry || new CallbackRegistry();
    this.sequenceTracker = options.sequenceTracker || new SequenceTracker();
  }

  setCredential(key: string, value: string): this {
    this.credentials[key] = value;
    return this;
  }

  getCredential(key: string): string | undefined {
    return this.credentials[key];
  }

  getCredentials(): Record<string, string> {
    return { ...this.credentials };
  }

  grantCapability(capability: string): this {
    this.capabilities.add(capability);
    return this;
  }

  hasCapability(capability: string): boolean {
    return this.capabilities.has(capability) || this.capabilities.has('*');
  }

  trackSubscription(cleanup: () => void): () => void {
    this.subscriptions.add(cleanup);
    return () => {
      this.subscriptions.delete(cleanup);
      cleanup();
    };
  }

  clearSubscriptions(): void {
    for (const cleanup of this.subscriptions) {
      try { cleanup(); } catch {}
    }
    this.subscriptions.clear();
  }

  dispose(): void {
    this.clearSubscriptions();
    this.callbackRegistry.clear();
    this.sequenceTracker.reset();
  }
}
