/**
 * @file ProtocolAdapter.ts
 * @description Standard ProtocolAdapter interface and envelope abstractions.
 */

import type { ProtocolType, EndpointDescriptor, IService, OperationContext } from '../services/ServiceContract.js';

export interface ProtocolCapabilities {
  requestResponse: boolean;
  streaming: boolean;
  pubSub: boolean;
  datagram: boolean;
  peerToPeer: boolean;
  signaling: boolean;
  discovery: boolean;
}

export interface ProtocolEnvelope<TPayload = unknown> {
  id: string;
  type: 'request' | 'response' | 'event' | 'signal' | 'heartbeat';
  operation?: string;
  payload?: TPayload;
  error?: string;
  correlationId?: string;
  timestamp: number;
}

export interface Connection {
  readonly id: string;
  readonly protocol: ProtocolType;
  send(envelope: ProtocolEnvelope): Promise<void>;
  close(): Promise<void>;
}

export interface ProtocolAdapter {
  readonly protocol: ProtocolType;
  readonly capabilities: ProtocolCapabilities;

  listen?(port: number, host?: string): Promise<EndpointDescriptor>;
  connect?(endpoint: EndpointDescriptor): Promise<Connection>;
  expose?(service: IService, port?: number): Promise<EndpointDescriptor>;
  stop?(): Promise<void>;

  send?(target: EndpointDescriptor | Connection, envelope: ProtocolEnvelope): Promise<ProtocolEnvelope>;
  receive?(handler: (envelope: ProtocolEnvelope, ctx?: OperationContext) => Promise<ProtocolEnvelope | void>): () => void;
}
