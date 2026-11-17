/**
 * @file ServiceDiscovery.ts
 * @description Discovery primitives for local and network services.
 */

import type { EndpointDescriptor } from '../services/ServiceContract.js';

export interface PeerRecord {
  id: string;
  name: string;
  endpoints: EndpointDescriptor[];
  lastSeen: number;
}

export class ServiceDiscovery {
  private peers: Map<string, PeerRecord> = new Map();

  registerPeer(id: string, name: string, endpoints: EndpointDescriptor[]): void {
    this.peers.set(id, {
      id,
      name,
      endpoints,
      lastSeen: Date.now(),
    });
  }

  getPeers(): PeerRecord[] {
    return Array.from(this.peers.values());
  }

  findPeer(id: string): PeerRecord | undefined {
    return this.peers.get(id);
  }
}
