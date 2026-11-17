/**
 * @file HttpProtocolAdapter.ts
 * @description HTTP/HTTPS adapter for service exposition and remote consumption.
 */

import http from 'http';
import type { ProtocolAdapter, ProtocolCapabilities, ProtocolEnvelope } from './ProtocolAdapter.js';
import type { EndpointDescriptor, IService } from '../services/ServiceContract.js';

export class HttpProtocolAdapter implements ProtocolAdapter {
  readonly protocol = 'http' as const;
  readonly capabilities: ProtocolCapabilities = {
    requestResponse: true,
    streaming: true,
    pubSub: false,
    datagram: false,
    peerToPeer: false,
    signaling: false,
    discovery: false,
  };

  private server?: http.Server;
  private listeningPort?: number;

  async listen(port: number, host = '127.0.0.1'): Promise<EndpointDescriptor> {
    this.server = http.createServer();
    await new Promise<void>((resolve, reject) => {
      this.server!.listen(port, host, () => {
        const addr = this.server!.address() as any;
        this.listeningPort = addr.port;
        resolve();
      });
      this.server!.on('error', reject);
    });
    return {
      protocol: 'http',
      address: host,
      port: this.listeningPort,
      capabilities: ['requestResponse', 'streaming'],
    };
  }

  async expose(service: IService, port = 0): Promise<EndpointDescriptor> {
    this.server = http.createServer(async (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

      if (url.pathname === '/manifest') {
        res.writeHead(200);
        res.end(JSON.stringify(service.getDefinition()));
        return;
      }

      if (url.pathname === '/health') {
        res.writeHead(200);
        res.end(JSON.stringify({ status: 'ok', service: service.name }));
        return;
      }

      if (url.pathname.startsWith('/call/')) {
        const op = url.pathname.slice('/call/'.length);
        let body = '';
        req.on('data', (c) => (body += c));
        req.on('end', async () => {
          try {
            const parsed = body ? JSON.parse(body) : {};
            const result = await service.call(op, parsed);
            res.writeHead(200);
            res.end(JSON.stringify({ status: 'success', payload: result }));
          } catch (err: any) {
            res.writeHead(500);
            res.end(JSON.stringify({ status: 'error', error: err.message || String(err) }));
          }
        });
        return;
      }

      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Route not found' }));
    });

    await new Promise<void>((resolve, reject) => {
      this.server!.listen(port, '127.0.0.1', () => {
        const addr = this.server!.address() as any;
        this.listeningPort = addr.port;
        resolve();
      });
      this.server!.on('error', reject);
    });

    return {
      protocol: 'http',
      address: '127.0.0.1',
      port: this.listeningPort,
      capabilities: ['requestResponse', 'streaming'],
    };
  }

  async send(endpoint: EndpointDescriptor, envelope: ProtocolEnvelope): Promise<ProtocolEnvelope> {
    const url = `http://${endpoint.address}:${endpoint.port}/call/${envelope.operation}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(envelope.payload || {}),
    });
    const json = (await res.json()) as any;
    return {
      id: `res-${Date.now()}`,
      type: 'response',
      correlationId: envelope.id,
      payload: json.payload,
      error: json.error,
      timestamp: Date.now(),
    };
  }

  async stop(): Promise<void> {
    if (this.server) {
      await new Promise<void>((resolve) => this.server!.close(() => resolve()));
      this.server = undefined;
    }
  }
}
