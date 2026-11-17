/**
 * @file index.ts
 * @description @kloks/services — Canonical KrnlTS Services A, B, C, D.
 * Exports ServiceFacade, ServiceDefinition, and related types for each service.
 * Built strictly on KrnlTS with zero dependency on Skipo or Floks.
 */

import {
  createService,
  createServiceDefinition,
  createServiceProxy,
  HttpProtocolAdapter,
  type IService,
  type ServiceDefinition,
  type EndpointDescriptor,
  type ProtocolAdapter,
} from '@ultrst-armada/krnl';

// ══════════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════════

export interface ServiceFacade<
  TState extends Record<string, unknown> = Record<string, unknown>,
  TEvents extends Record<string, unknown> = Record<string, unknown>
> {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly runtime: 'client' | 'server';
  readonly deployment: 'local' | 'remote';
  readonly definition: ServiceDefinition<TState, TEvents>;
  readonly telemetry: import('@ultrst-armada/krnl').TelemetryController;
  createInstance(): IService<TState, TEvents>;
  execute<TIn = unknown, TOut = unknown>(operation: string, input?: TIn): Promise<TOut>;
}

export interface MathInput {
  a: number;
  b: number;
}

export interface CounterState extends Record<string, unknown> {
  count: number;
  lastUpdated: number;
}

export interface TelemetryEvents extends Record<string, unknown> {
  reading: { metric: string; value: number; timestamp: number };
}

// ══════════════════════════════════════════════════════════════════════════════
// SERVICE A: PURE STATELESS SERVICE
// ══════════════════════════════════════════════════════════════════════════════

export const ServiceADefinition: ServiceDefinition = createServiceDefinition({
  id: 'kloks.service.a',
  name: 'ServiceA',
  version: '1.0.0',
  operations: {
    add: {
      id: 'ServiceA.add',
      name: 'add',
      description: 'Deterministic addition of two numbers',
      handler: async (input: MathInput) => ({
        result: Number(input.a) + Number(input.b),
      }),
    },
    multiply: {
      id: 'ServiceA.multiply',
      name: 'multiply',
      description: 'Deterministic multiplication of two numbers',
      handler: async (input: MathInput) => ({
        result: Number(input.a) * Number(input.b),
      }),
    },
  },
});

const serviceAInstance = createService(ServiceADefinition);

export const ServiceAFacade: ServiceFacade = {
  id: ServiceADefinition.id,
  name: ServiceADefinition.name,
  version: ServiceADefinition.version,
  runtime: 'server',
  deployment: 'local',
  definition: ServiceADefinition,
  telemetry: serviceAInstance.telemetry,
  createInstance: () => createService(ServiceADefinition),
  execute: async <TIn = unknown, TOut = unknown>(op: string, input?: TIn) => { await serviceAInstance.start(); return serviceAInstance.call<TIn, TOut>(op, input); },
};

// ══════════════════════════════════════════════════════════════════════════════
// SERVICE B: STATEFUL SERVICE
// ══════════════════════════════════════════════════════════════════════════════

export function createServiceB(): IService<CounterState> {
  let instanceRef: IService<CounterState>;
  const def = createServiceDefinition<CounterState>({
    id: 'kloks.service.b',
    name: 'ServiceB',
    version: '1.0.0',
    state: {
      initial: { count: 0, lastUpdated: 0 },
    },
    operations: {
      increment: {
        id: 'ServiceB.increment',
        name: 'increment',
        handler: async (input?: { delta?: number }) => {
          const delta = input?.delta ?? 1;
          const next = instanceRef.getState().count + delta;
          const now = Date.now();
          instanceRef.setState({ count: next, lastUpdated: now });
          return { count: next, lastUpdated: now };
        },
      },
      getCount: {
        id: 'ServiceB.getCount',
        name: 'getCount',
        handler: async () => instanceRef.getState(),
      },
      reset: {
        id: 'ServiceB.reset',
        name: 'reset',
        handler: async () => {
          const now = Date.now();
          instanceRef.setState({ count: 0, lastUpdated: now });
          return { count: 0, lastUpdated: now };
        },
      },
    },
  });
  instanceRef = createService<CounterState>(def);
  return instanceRef;
}

const defaultServiceB = createServiceB();
export const ServiceBDefinition = defaultServiceB.getDefinition();

export const ServiceBFacade: ServiceFacade<CounterState> = {
  id: ServiceBDefinition.id,
  name: ServiceBDefinition.name,
  version: ServiceBDefinition.version,
  runtime: 'server',
  deployment: 'local',
  definition: ServiceBDefinition,
  get telemetry() { return defaultServiceB.telemetry; },
  createInstance: createServiceB,
  execute: async <TIn = unknown, TOut = unknown>(op: string, input?: TIn) => { await defaultServiceB.start(); return defaultServiceB.call<TIn, TOut>(op, input); },
};

// ══════════════════════════════════════════════════════════════════════════════
// SERVICE C: EVENT-EMITTING SERVICE
// ══════════════════════════════════════════════════════════════════════════════

export function createServiceC(): IService<Record<string, unknown>, TelemetryEvents> {
  const def = createServiceDefinition<Record<string, unknown>, TelemetryEvents>({
    id: 'kloks.service.c',
    name: 'ServiceC',
    version: '1.0.0',
    operations: {
      publishReading: {
        id: 'ServiceC.publishReading',
        name: 'publishReading',
        handler: async (input: { metric: string; value: number }) => {
          const payload = {
            metric: input.metric,
            value: input.value,
            timestamp: Date.now(),
          };
          return payload;
        },
      },
    },
  });
  return createService<Record<string, unknown>, TelemetryEvents>(def);
}

const defaultServiceC = createServiceC();
export const ServiceCDefinition = defaultServiceC.getDefinition();

export const ServiceCFacade: ServiceFacade<Record<string, unknown>, TelemetryEvents> = {
  id: ServiceCDefinition.id,
  name: ServiceCDefinition.name,
  version: ServiceCDefinition.version,
  runtime: 'server',
  deployment: 'local',
  definition: ServiceCDefinition,
  get telemetry() { return defaultServiceC.telemetry; },
  createInstance: createServiceC,
  execute: async <TIn = unknown, TOut = unknown>(op: string, input?: TIn) => { await defaultServiceC.start(); return defaultServiceC.call<TIn, TOut>(op, input); },
};

// ══════════════════════════════════════════════════════════════════════════════
// SERVICE D: PROTOCOL-ENABLED SERVICE
// ══════════════════════════════════════════════════════════════════════════════

export const ServiceDDefinition: ServiceDefinition = createServiceDefinition({
  id: 'kloks.service.d',
  name: 'ServiceD',
  version: '1.0.0',
  protocols: ['http', 'ws', 'udp', 'p2p'],
  capabilities: [
    {
      id: 'rpc.echo',
      name: 'Protocol Echo & Transform',
      protocols: ['http', 'ws', 'udp', 'p2p'],
    },
  ],
  operations: {
    echo: {
      id: 'ServiceD.echo',
      name: 'echo',
      protocols: ['http', 'ws', 'udp', 'p2p'],
      handler: async (input: { message: string }, ctx) => ({
        echoed: input.message,
        protocol: ctx.protocol ?? 'memory',
        timestamp: Date.now(),
      }),
    },
    uppercase: {
      id: 'ServiceD.uppercase',
      name: 'uppercase',
      protocols: ['http', 'ws', 'udp', 'p2p'],
      handler: async (input: { text?: string } | string) => ({
        result: (typeof input === 'string' ? input : (input as any)?.text ?? '').toUpperCase(),
      }),
    },
  },
});

const defaultServiceD = createService(ServiceDDefinition);

export interface ProtocolExposureHandle {
  service: IService;
  proxy: IService;
  endpoint: EndpointDescriptor;
  adapter: ProtocolAdapter;
  stop: () => Promise<void>;
}

export async function exposeServiceD(
  adapter: ProtocolAdapter = new HttpProtocolAdapter(),
  port = 0
): Promise<ProtocolExposureHandle> {
  const svc = createService(ServiceDDefinition);
  await svc.start();
  if (!adapter.expose) {
    throw new Error('ProtocolAdapter does not support expose()');
  }
  const endpoint = await adapter.expose(svc, port);
  const proxy = createServiceProxy(ServiceDDefinition, adapter, endpoint);
  return {
    service: svc,
    proxy,
    endpoint,
    adapter,
    stop: async () => {
      if (adapter.stop) {
        await adapter.stop();
      }
      await svc.stop();
    },
  };
}

export const ServiceDFacade: ServiceFacade = {
  id: ServiceDDefinition.id,
  name: ServiceDDefinition.name,
  version: ServiceDDefinition.version,
  runtime: 'server',
  deployment: 'remote',
  definition: ServiceDDefinition,
  get telemetry() { return defaultServiceD.telemetry; },
  createInstance: () => createService(ServiceDDefinition),
  execute: async <TIn = unknown, TOut = unknown>(op: string, input?: TIn) => { await defaultServiceD.start(); return defaultServiceD.call<TIn, TOut>(op, input); },
};

// ══════════════════════════════════════════════════════════════════════════════
// KRNL CANONICAL SERVICE EXPORTS (Standardized krnl* Prefix Rule)
// ══════════════════════════════════════════════════════════════════════════════
export const krnlServiceADefinition = ServiceADefinition;
export const krnlServiceAFacade = ServiceAFacade;
export const krnlServiceBDefinition = ServiceBDefinition;
export const krnlServiceBFacade = ServiceBFacade;
export const krnlCreateServiceB = createServiceB;
export const krnlServiceCDefinition = ServiceCDefinition;
export const krnlServiceCFacade = ServiceCFacade;
export const krnlCreateServiceC = createServiceC;
export const krnlServiceDDefinition = ServiceDDefinition;
export const krnlServiceDFacade = ServiceDFacade;
export const krnlExposeServiceD = exposeServiceD;

export * from './client-services/index.js';


export * from './engineering/index.js';

export * from './serviceDiscovery.js';
