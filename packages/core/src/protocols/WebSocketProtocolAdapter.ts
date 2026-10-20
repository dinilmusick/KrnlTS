/**
 * @file WebSocketProtocolAdapter.ts
 * @description WebSocket full-duplex protocol adapter for services (browser + Node safe).
 */

import type { ProtocolAdapter, ProtocolCapabilities, ProtocolEnvelope } from './ProtocolAdapter.js';
import type { EndpointDescriptor, IService } from '../services/ServiceContract.js';

export class WebSocketProtocolAdapter implements ProtocolAdapter {
  readonly protocol = 'ws' as const;
  readonly capabilities: ProtocolCapabilities = {
    requestResponse: true,
    streaming: true,
    pubSub: true,
    datagram: false,
    peerToPeer: false,
    signaling: false,
    discovery: false,
  };

  private server?: any;
  private wss?: any;
  private port?: number;

  async expose(service: IService, port = 0): Promise<EndpointDescriptor> {
    const httpMod: any = await import('http');
    const http = httpMod.default || httpMod;
    const wsMod: any = await import('ws').catch(() => null);
    if (!wsMod) {
      throw new Error('WebSocketProtocolAdapter.expose requires "ws" package in Node.js environment.');
    }
    const WebSocketServer = wsMod.WebSocketServer || wsMod.default?.WebSocketServer || wsMod.Server;
    this.server = http.createServer();
    this.wss = new WebSocketServer({ server: this.server });

    this.wss.on('connection', (ws: any) => {
      ws.on('message', async (raw: any) => {
        try {
          const envelope = JSON.parse(raw.toString()) as ProtocolEnvelope;
          if (envelope.type === 'request' && envelope.operation) {
            try {
              const res = await service.call(envelope.operation, envelope.payload);
              ws.send(JSON.stringify({
                id: `res-${Date.now()}`,
                type: 'response',
                correlationId: envelope.id,
                payload: res,
                timestamp: Date.now(),
              }));
            } catch (err: any) {
              ws.send(JSON.stringify({
                id: `res-${Date.now()}`,
                type: 'response',
                correlationId: envelope.id,
                error: err.message || String(err),
                timestamp: Date.now(),
              }));
            }
          }
        } catch (_) {}
      });
    });

    await new Promise<void>((resolve, reject) => {
      this.server!.listen(port, '127.0.0.1', () => {
        const addr = this.server!.address() as any;
        this.port = addr.port;
        resolve();
      });
      this.server!.on('error', reject);
    });

    return {
      protocol: 'ws',
      address: '127.0.0.1',
      port: this.port,
      capabilities: ['requestResponse', 'pubSub', 'streaming'],
    };
  }

  async send(endpoint: EndpointDescriptor, envelope: ProtocolEnvelope): Promise<ProtocolEnvelope> {
    let WS: any;
    // Node's built-in WebSocket follows the browser EventTarget API and does not
    // provide ws.on(...). Prefer the ws package in Node; use the global browser
    // implementation only when running outside Node or when ws is unavailable.
    const isNode = Boolean((globalThis as any).process?.versions?.node);
    if (isNode) {
      const wsMod: any = await import('ws').catch(() => null);
      WS = wsMod?.WebSocket || wsMod?.default?.WebSocket || wsMod?.default || wsMod;
    }
    if (!WS) {
      WS = (globalThis as any).WebSocket;
    }
    if (!WS) {
      throw new Error('No WebSocket client implementation available in this environment.');
    }
    return new Promise((resolve, reject) => {
      const ws = new WS(`ws://${endpoint.address}:${endpoint.port}`);
      ws.on('open', () => {
        ws.send(JSON.stringify(envelope));
      });
      ws.on('message', (data: any) => {
        try {
          const res = JSON.parse(data.toString()) as ProtocolEnvelope;
          ws.close();
          resolve(res);
        } catch (e) {
          ws.close();
          reject(e);
        }
      });
      ws.on('error', (err: any) => {
        reject(err);
      });
    });
  }

  async stop(): Promise<void> {
    if (this.wss) {
      await new Promise<void>((r) => this.wss!.close(() => r()));
      this.wss = undefined;
    }
    if (this.server) {
      await new Promise<void>((r) => this.server!.close(() => r()));
      this.server = undefined;
    }
  }
}
