/**
 * @file P2PProtocolAdapter.ts
 * @description Signaling & P2P virtual routing protocol adapter.
 */

import type { ProtocolAdapter, ProtocolCapabilities, ProtocolEnvelope } from './ProtocolAdapter.js';
import type { EndpointDescriptor, IService } from '../services/ServiceContract.js';

export class P2PProtocolAdapter implements ProtocolAdapter {
  readonly protocol = 'p2p' as const;
  readonly capabilities: ProtocolCapabilities = {
    requestResponse: true,
    streaming: true,
    pubSub: true,
    datagram: false,
    peerToPeer: true,
    signaling: true,
    discovery: true,
  };

  private static peerHub: Map<string, IService> = new Map();

  async expose(service: IService): Promise<EndpointDescriptor> {
    P2PProtocolAdapter.peerHub.set(service.id, service);
    return {
      protocol: 'p2p',
      address: `p2p://${service.id}`,
      capabilities: ['peerToPeer', 'requestResponse', 'pubSub'],
    };
  }

  async send(endpoint: EndpointDescriptor, envelope: ProtocolEnvelope): Promise<ProtocolEnvelope> {
    const peerId = endpoint.address.replace('p2p://', '');
    const service = P2PProtocolAdapter.peerHub.get(peerId);
    if (!service) {
      return {
        id: `res-${Date.now()}`,
        type: 'response',
        correlationId: envelope.id,
        error: `Peer '${peerId}' not discovered or offline.`,
        timestamp: Date.now(),
      };
    }

    try {
      const res = await service.call(envelope.operation || '', envelope.payload);
      return {
        id: `res-${Date.now()}`,
        type: 'response',
        correlationId: envelope.id,
        payload: res,
        timestamp: Date.now(),
      };
    } catch (err: any) {
      return {
        id: `res-${Date.now()}`,
        type: 'response',
        correlationId: envelope.id,
        error: err.message || String(err),
        timestamp: Date.now(),
      };
    }
  }

  async stop(): Promise<void> {
    P2PProtocolAdapter.peerHub.clear();
  }
}
