/**
 * @file EndpointGenerator.ts
 * @description Inspects CompositeBackend / services and generates protocol routes/channels.
 */

import type { CompositeBackend } from './CompositeBackend.js';
import type { EndpointDescriptor } from '@ultrst-armada/krnl';

export interface GeneratedEndpointSummary {
  httpRoutes: string[];
  wsChannels: string[];
  udpEndpoints: string[];
  p2pBindings: string[];
}

export class EndpointGenerator {
  static generateEndpoints(backend: CompositeBackend, basePort = 8000): GeneratedEndpointSummary {
    const def = backend.getDefinition();
    const ops = Object.keys(def.operations);

    return {
      httpRoutes: ops.map((op) => `/api/${op.replace('.', '/')}`),
      wsChannels: ops.map((op) => `channel:${op}`),
      udpEndpoints: [`udp://127.0.0.1:${basePort}`],
      p2pBindings: ops.map((op) => `p2p://${backend.name}/${op}`),
    };
  }

  static generateDescriptors(backend: CompositeBackend, host = '127.0.0.1', port = 8080): EndpointDescriptor[] {
    return [
      { protocol: 'http', address: host, port, capabilities: ['requestResponse'] },
      { protocol: 'ws', address: host, port, capabilities: ['requestResponse', 'pubSub'] },
      { protocol: 'udp', address: host, port, capabilities: ['datagram'] },
      { protocol: 'p2p', address: `p2p://${backend.name}`, capabilities: ['peerToPeer'] },
    ];
  }
}
