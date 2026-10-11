/**
 * @file UdpProtocolAdapter.ts
 * @description UDP datagram adapter for services and beacon messaging.
 */

import dgram from 'dgram';
import type { ProtocolAdapter, ProtocolCapabilities, ProtocolEnvelope } from './ProtocolAdapter.js';
import type { EndpointDescriptor, IService } from '../services/ServiceContract.js';

export class UdpProtocolAdapter implements ProtocolAdapter {
  readonly protocol = 'udp' as const;
  readonly capabilities: ProtocolCapabilities = {
    requestResponse: true,
    streaming: false,
    pubSub: false,
    datagram: true,
    peerToPeer: false,
    signaling: false,
    discovery: true,
  };

  private socket?: dgram.Socket;
  private port?: number;

  async expose(service: IService, port = 0): Promise<EndpointDescriptor> {
    this.socket = dgram.createSocket('udp4');

    this.socket.on('message', async (msg, rinfo) => {
      try {
        const envelope = JSON.parse(msg.toString()) as ProtocolEnvelope;
        if (envelope.type === 'request' && envelope.operation) {
          try {
            const res = await service.call(envelope.operation, envelope.payload);
            const resp = JSON.stringify({
              id: `res-${Date.now()}`,
              type: 'response',
              correlationId: envelope.id,
              payload: res,
              timestamp: Date.now(),
            });
            this.socket!.send(resp, rinfo.port, rinfo.address);
          } catch (err: any) {
            const resp = JSON.stringify({
              id: `res-${Date.now()}`,
              type: 'response',
              correlationId: envelope.id,
              error: err.message || String(err),
              timestamp: Date.now(),
            });
            this.socket!.send(resp, rinfo.port, rinfo.address);
          }
        }
      } catch (_) {}
    });

    await new Promise<void>((resolve) => {
      this.socket!.bind(port, '127.0.0.1', () => {
        this.port = this.socket!.address().port;
        resolve();
      });
    });

    return {
      protocol: 'udp',
      address: '127.0.0.1',
      port: this.port,
      capabilities: ['datagram', 'requestResponse'],
    };
  }

  async send(endpoint: EndpointDescriptor, envelope: ProtocolEnvelope): Promise<ProtocolEnvelope> {
    return new Promise((resolve, reject) => {
      const client = dgram.createSocket('udp4');
      const payload = Buffer.from(JSON.stringify(envelope));

      client.on('message', (msg) => {
        try {
          const res = JSON.parse(msg.toString()) as ProtocolEnvelope;
          client.close();
          resolve(res);
        } catch (e) {
          client.close();
          reject(e);
        }
      });

      client.on('error', (err) => {
        client.close();
        reject(err);
      });

      client.send(payload, endpoint.port!, endpoint.address);
    });
  }

  async stop(): Promise<void> {
    if (this.socket) {
      await new Promise<void>((r) => this.socket!.close(() => r()));
      this.socket = undefined;
    }
  }
}
