/**
 * @file MemoryTransport.ts
 * @description In-memory direct transport implementation.
 */

import type { ProtocolEnvelope } from '../protocols/ProtocolAdapter.js';

export class MemoryTransport {
  private handlers: Set<(envelope: ProtocolEnvelope) => Promise<ProtocolEnvelope | void>> = new Set();

  onMessage(handler: (envelope: ProtocolEnvelope) => Promise<ProtocolEnvelope | void>): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  async send(envelope: ProtocolEnvelope): Promise<ProtocolEnvelope> {
    for (const handler of this.handlers) {
      const res = await handler(envelope);
      if (res) return res;
    }
    return {
      id: `res-${Date.now()}`,
      type: 'response',
      correlationId: envelope.id,
      payload: null,
      timestamp: Date.now(),
    };
  }
}
