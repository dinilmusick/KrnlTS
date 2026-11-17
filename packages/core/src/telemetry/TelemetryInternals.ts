import type { TelemetryInvocation } from './TelemetryTypes.js';
import type { sampleResources } from './TelemetryResources.js';

export type ActiveInvocation = {
  invocationId: string;
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  serviceId: string;
  target: string;
  kind: TelemetryInvocation['kind'];
  correlationId?: string;
  startedAt: number;
  resourcesStart?: ReturnType<typeof sampleResources>;
};

function createRuntimeId(): string {
  const cryptoApi = globalThis.crypto;
  if (typeof cryptoApi?.randomUUID === 'function') {
    return cryptoApi.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export const createTelemetryId = (prefix: string) => `${prefix}_${createRuntimeId()}`;
